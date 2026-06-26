"""
Geo-Named Entity Recognition Module for GAIA
Extracts Philippine location information using hybrid NER + pattern matching.
Adapted from GeoAware with enhancements for GAIA's requirements.
"""

from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import logging
import re
import os
from typing import Dict, List, Optional
import time

# Import Philippine regional data
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from philippine_regions import (
    get_region_from_location,
    normalize_location_with_region,
    PHILIPPINE_ADMIN_MAPPING,
    PROVINCE_TO_REGION,
    PHILIPPINE_LANDMARKS
)

logger = logging.getLogger(__name__)

# Specificity ranking for choosing THE hazard location among several candidates.
# Higher = more precise. Explicit coordinates always win; broad areas (island /
# region) rank lowest so a city/province/coords is preferred over e.g. "Mindanao".
SPECIFICITY_RANK = {
    'coordinates': 5,
    'street': 4, 'barangay': 4, 'landmark': 4,
    'city': 3, 'municipality': 3,
    'location': 2, 'province': 2,
    'region': 1, 'island': 1,
}

# Island groups are not in the province/region lists but must rank as broad areas.
ISLAND_GROUPS = {'Luzon', 'Visayas', 'Mindanao'}

# Philippine bounding box (lat 4-22°N, lng 116-127°E) — shared validation.
def _within_philippines(lat: float, lng: float) -> bool:
    if not (4.0 <= lat <= 22.0 and 116.0 <= lng <= 127.0):
        return False
    try:
        from backend.python.lib.supabase_client import supabase
        resp = supabase.schema("gaia").rpc("get_psgc_hierarchy_batch", {"p_points": [[lng, lat]]}).execute()
        return bool(resp.data)
    except Exception:
        import logging
        logging.getLogger(__name__).exception(
            "PostGIS boundary check failed; rejecting coordinates"
        )
        return False


class GeoNER:
    """
    Geographic Named Entity Recognition for Philippine locations.
    Hybrid approach: BERT NER + Philippine-specific pattern matching + Geocoding
    """
    
    # Philippine Provinces (81 total)
    PHILIPPINE_PROVINCES = [
        "Abra", "Agusan del Norte", "Agusan del Sur", "Aklan", "Albay", "Antique", "Apayao", "Aurora",
        "Basilan", "Bataan", "Batanes", "Batangas", "Benguet", "Biliran", "Bohol", "Bukidnon", "Bulacan",
        "Cagayan", "Camarines Norte", "Camarines Sur", "Camiguin", "Capiz", "Catanduanes", "Cavite", "Cebu",
        "Cotabato", "Davao de Oro", "Davao del Norte", "Davao del Sur", "Davao Occidental", "Davao Oriental",
        "Dinagat Islands", "Eastern Samar", "Guimaras", "Ifugao", "Ilocos Norte", "Ilocos Sur", "Iloilo",
        "Isabela", "Kalinga", "La Union", "Laguna", "Lanao del Norte", "Lanao del Sur", "Leyte", "Maguindanao",
        "Marinduque", "Masbate", "Misamis Occidental", "Misamis Oriental", "Mountain Province",
        "Negros Occidental", "Negros Oriental", "Northern Samar", "Nueva Ecija", "Nueva Vizcaya",
        "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Pampanga", "Pangasinan", "Quezon", "Quirino",
        "Rizal", "Romblon", "Samar", "Sarangani", "Siquijor", "Sorsogon", "South Cotabato", "Southern Leyte",
        "Sultan Kudarat", "Sulu", "Surigao del Norte", "Surigao del Sur", "Tarlac", "Tawi-Tawi", "Zambales",
        "Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay", "Metro Manila"
    ]
    
    # Philippine Regions (with aliases)
    PHILIPPINE_REGIONS = [
        "NCR", "National Capital Region",
        "CAR", "Cordillera Administrative Region",
        "Region I", "Ilocos Region",
        "Region II", "Cagayan Valley",
        "Region III", "Central Luzon",
        "Region IV-A", "CALABARZON",
        "Region IV-B", "MIMAROPA",
        "Region V", "Bicol Region", "Bicol", "Bicolandia",
        "Region VI", "Western Visayas",
        "Region VII", "Central Visayas",
        "Region VIII", "Eastern Visayas",
        "Region IX", "Zamboanga Peninsula",
        "Region X", "Northern Mindanao",
        "Region XI", "Davao Region",
        "Region XII", "SOCCSKSARGEN",
        "Region XIII", "Caraga",
        "BARMM", "Bangsamoro", "Bangsamoro Autonomous Region in Muslim Mindanao"
    ]
    
    # Major Philippine Cities (HUCs + ICCs + Major Cities)
    PHILIPPINE_CITIES = [
        # Metro Manila
        "Manila", "Quezon City", "Caloocan", "Las Piñas", "Makati", "Malabon", "Mandaluyong", "Marikina",
        "Muntinlupa", "Navotas", "Parañaque", "Pasay", "Pasig", "San Juan", "Taguig", "Valenzuela",
        
        # Luzon Major Cities
        "Baguio", "Angeles", "Olongapo", "Antipolo", "Lucena", "Tayabas",
        "Batangas City", "Lipa", "Tanauan", "San Pablo", "Calamba", "Santa Rosa", "Biñan", "Cabuyao", "San Pedro",
        "Cavite City", "Dasmariñas", "Bacoor", "Imus", "General Trias", "Tagaytay", "Trece Martires",
        "San Jose del Monte", "Malolos", "Meycauayan", "Balanga", "Cabanatuan", "Gapan",
        "Science City of Muñoz", "San Jose", "Palayan", "Tarlac City",
        "Dagupan", "Alaminos", "San Carlos", "Urdaneta", "San Fernando", "Laoag", "Vigan", "Candon",
        "Tuguegarao", "Ilagan", "Cauayan", "Santiago", "Tabuk",
        "Legazpi", "Ligao", "Tabaco", "Naga", "Iriga", "Sorsogon City", "Masbate City",
        
        # Visayas Major Cities
        "Iloilo City", "Roxas", "Passi",
        "Bacolod", "Bago", "Cadiz", "Escalante", "Himamaylan", "Kabankalan", "La Carlota", "Sagay",
        "San Carlos", "Silay", "Victorias",
        "Cebu City", "Mandaue", "Lapu-Lapu", "Carcar", "Naga City", "Talisay", "Toledo", "Bogo", "Danao",
        "Tagbilaran", "Dumaguete", "Bais", "Bayawan", "Guihulngan", "Tanjay", "Canlaon",
        "Tacloban", "Ormoc", "Baybay", "Calbayog", "Catbalogan", "Borongan", "Maasin",
        
        # Mindanao Major Cities
        "Zamboanga City", "Pagadian", "Dapitan", "Dipolog", "Isabela City",
        "Cagayan de Oro", "Iligan", "Gingoog", "El Salvador", "Oroquieta", "Ozamiz", "Tangub",
        "Davao City", "Digos", "Panabo", "Samal", "Tagum", "Mati",
        "General Santos", "Koronadal", "Kidapawan", "Tacurong", "Cotabato City",
        "Butuan", "Cabadbaran", "Bayugan", "Surigao", "Tandag", "Bislig",
        "Marawi", "Lamitan", "Puerto Princesa", "Calapan"
    ]
    
    @staticmethod
    def _build_name_pattern(names: List[str]) -> str:
        """Build regex pattern from list of location names"""
        # Escape special chars and sort by length (longer names first)
        escaped = [re.escape(n) for n in names]
        escaped.sort(key=len, reverse=True)
        return r"\b(?:" + "|".join(escaped) + r")\b"
    
    # Build patterns for efficient matching
    PHILIPPINES_PATTERNS = {
        'cities': _build_name_pattern.__func__(PHILIPPINE_CITIES),
        'provinces': _build_name_pattern.__func__(PHILIPPINE_PROVINCES),
        'regions': _build_name_pattern.__func__(PHILIPPINE_REGIONS),
    }
    
    def __init__(self, ner_model_name: str = 'dslim/bert-base-NER', cache_dir: str = None):
        """
        Initialize Geo-NER module.
        
        Args:
            ner_model_name: HuggingFace NER model name
            cache_dir: Directory to cache models
        """
        self.ner_model_name = ner_model_name
        self.cache_dir = cache_dir or os.getenv('HF_CACHE_DIR', '/app/models/cache')
        self.ner_model = None
        self.tokenizer = None
        self.geocoder = None
        self._last_geocode_time = 0  # For rate limiting
    
    def load_model(self):
        """Load NER model and initialize geocoder"""
        if self.ner_model is None:
            try:
                logger.info(f"Loading NER model: {self.ner_model_name}")
                logger.info(f"Cache directory: {self.cache_dir}")
                
                # Create cache directory
                os.makedirs(self.cache_dir, exist_ok=True)
                
                # Load tokenizer and model
                self.tokenizer = AutoTokenizer.from_pretrained(
                    self.ner_model_name,
                    cache_dir=self.cache_dir
                )
                model = AutoModelForTokenClassification.from_pretrained(
                    self.ner_model_name,
                    cache_dir=self.cache_dir
                )
                
                # Create NER pipeline with aggregation
                self.ner_model = pipeline(
                    "ner",
                    model=model,
                    tokenizer=self.tokenizer,
                    aggregation_strategy="max"  # Use 'max' to properly merge subword tokens like R + ##izal
                )
                
                # Initialize geocoder (Nominatim from OpenStreetMap)
                self.geocoder = Nominatim(
                    user_agent="gaia_hazard_detection",
                    timeout=10
                )
                
                logger.info("NER model and geocoder loaded successfully")
                
            except Exception as e:
                logger.error(f"Error loading NER model: {str(e)}")
                raise
    
    def extract_locations(self, text: str) -> List[Dict]:
        """
        Extract location entities from text using hybrid approach.
        
        Args:
            text: Text to extract locations from
            
        Returns:
            list: List of location dictionaries with details:
                {
                    'location_name': 'Manila',
                    'location_type': 'city',
                    'confidence': 0.95,
                    'source': 'pattern',
                    'latitude': 14.5995,
                    'longitude': 120.9842,
                    'city': 'Manila',
                    'province': 'Metro Manila',
                    'region': 'NCR',
                    'country': 'Philippines'
                }
        """
        if self.ner_model is None:
            self.load_model()
        
        locations = []
        
        try:
            # Step 1: Pattern matching for Philippine-specific locations (high confidence)
            philippines_locations = self._extract_philippines_locations(text)
            
            # Step 2: Use NER model for general location extraction
            entities = self.ner_model(text)
            
            for entity in entities:
                # Only process location entities
                if entity['entity_group'] in ['LOC', 'GPE']:
                    location_name = entity['word']
                    
                    # Skip if already found in Philippines-specific patterns
                    if any(loc['location_name'].lower() == location_name.lower() for loc in philippines_locations):
                        continue
                    
                    location_data = {
                        'location_name': location_name,
                        'location_type': self._classify_location_type(location_name),
                        'confidence': float(entity['score']),
                        'source': 'ner'
                    }
                    
                    # Try to geocode
                    coords = self._geocode_location(location_name)
                    if coords:
                        location_data.update(coords)
                        
                        # Enrich with regional data if available
                        region_info = get_region_from_location(
                            city=coords.get('city'),
                            province=coords.get('province')
                        )
                        if region_info:
                            location_data.update({
                                'region': region_info.get('region'),
                                'region_name': region_info.get('region_name')
                            })
                    
                    # Fallback: check if the entity name itself is a known landmark
                    if not location_data.get('region'):
                        landmark_info = PHILIPPINE_LANDMARKS.get(location_name)
                        if not landmark_info:
                            for lm_key, lm_val in PHILIPPINE_LANDMARKS.items():
                                if lm_key.lower() == location_name.lower():
                                    landmark_info = lm_val
                                    break
                        if landmark_info:
                            location_data.update({
                                'province': landmark_info.get('province'),
                                'region': landmark_info.get('region'),
                                'region_name': landmark_info.get('region_name'),
                                'location_type': landmark_info.get('landmark_type', 'landmark'),
                            })
                    
                    locations.append(location_data)
            
            # Add Philippines-specific locations (higher priority)
            locations.extend(philippines_locations)

            # Step 3: Explicit coordinates (e.g. "05.57°N, 124.98°E" in PHIVOLCS /
            # PAGASA bulletins) are the most precise signal — prepend with top
            # priority so they win the primary-location selection.
            locations = self._extract_explicit_coordinates(text, named_locations=locations) + locations

            # Deduplicate locations
            locations = self._deduplicate_locations(locations)
            
            logger.info(f"Extracted {len(locations)} unique locations from text")
            return locations
            
        except Exception as e:
            logger.error(f"Error extracting locations: {str(e)}")
            return []
    
    def _extract_philippines_locations(self, text: str) -> List[Dict]:
        """Extract Philippine-specific locations using regex patterns and regional enrichment"""
        locations = []
        
        # Match cities from PHILIPPINE_ADMIN_MAPPING
        for city_name, admin_data in PHILIPPINE_ADMIN_MAPPING.items():
            # Case-insensitive word boundary match
            pattern = rf"\b{re.escape(city_name)}\b"
            if re.search(pattern, text, re.IGNORECASE):
                location_data = {
                    'location_name': city_name,
                    'location_type': 'city',
                    'confidence': 0.95,  # High confidence for pattern matches
                    'source': 'pattern',
                    'country': 'Philippines',
                    'province': admin_data.get('province'),
                    'region': admin_data.get('region'),
                    'region_name': admin_data.get('region_name')
                }
                
                # Try to geocode for coordinates
                coords = self._geocode_location(f"{city_name}, Philippines")
                if coords and 'latitude' in coords and 'longitude' in coords:
                    location_data.update({
                        'latitude': coords['latitude'],
                        'longitude': coords['longitude']
                    })
                
                locations.append(location_data)
        
        # Match provinces from PROVINCE_TO_REGION
        for province_name, region_data in PROVINCE_TO_REGION.items():
            pattern = rf"\b{re.escape(province_name)}\b"
            if re.search(pattern, text, re.IGNORECASE):
                location_data = {
                    'location_name': province_name,
                    'location_type': 'province',
                    'confidence': 0.95,
                    'source': 'pattern',
                    'country': 'Philippines',
                    'province': province_name,
                    'region': region_data.get('region'),
                    'region_name': region_data.get('region_name')
                }
                
                # Try to geocode
                coords = self._geocode_location(f"{province_name}, Philippines")
                if coords and 'latitude' in coords and 'longitude' in coords:
                    location_data.update({
                        'latitude': coords['latitude'],
                        'longitude': coords['longitude']
                    })
                
                locations.append(location_data)
        
        # Match landmarks (volcanoes, lakes, etc.) from PHILIPPINE_LANDMARKS
        for landmark_name, landmark_data in PHILIPPINE_LANDMARKS.items():
            pattern = rf"\b{re.escape(landmark_name)}\b"
            if re.search(pattern, text, re.IGNORECASE):
                # Skip if a more specific match (city/province) already covers this location
                if any(loc['location_name'].lower() == landmark_name.lower() for loc in locations):
                    continue

                location_data = {
                    'location_name': landmark_name,
                    'location_type': landmark_data.get('landmark_type', 'landmark'),
                    'confidence': 0.93,
                    'source': 'pattern',
                    'country': 'Philippines',
                    'province': landmark_data.get('province'),
                    'region': landmark_data.get('region'),
                    'region_name': landmark_data.get('region_name')
                }

                coords = self._geocode_location(f"{landmark_name}, Philippines")
                if coords and 'latitude' in coords and 'longitude' in coords:
                    location_data.update({
                        'latitude': coords['latitude'],
                        'longitude': coords['longitude']
                    })

                locations.append(location_data)

        # Match barangays (local administrative divisions) - limit to 2-5 words
        for match in re.finditer(r"\b(?:Barangay|Brgy\.?|Sitio|Purok)\s+([A-Z][A-Za-z\-']+(?:\s+[A-Z][A-Za-z\-']+){0,4})\b", text):
            barangay_name = match.group(1).strip()
            barangay_full = f"{match.group(0).split()[0]} {barangay_name}"  # "Barangay Name" or "Brgy. Name"
            
            # Skip if barangay name is too long (likely captured sentence fragment)
            if len(barangay_name.split()) > 5:
                continue
                
            locations.append({
                'location_name': barangay_full,
                'location_type': 'barangay',
                'confidence': 0.9,
                'source': 'pattern',
                'country': 'Philippines'
            })
        
        # Match streets
        for match in re.finditer(
            r"\b([A-Z][\w'\-]+\s+(?:Street|St\.|Road|Rd\.|Avenue|Ave\.|Boulevard|Blvd\.|Highway|Hwy))\b",
            text
        ):
            street_full = match.group(0)
            locations.append({
                'location_name': street_full,
                'location_type': 'street',
                'confidence': 0.85,
                'source': 'pattern'
            })
        
        return locations
    
    def _classify_location_type(self, location_name: str) -> str:
        """Classify the type of location based on name patterns"""
        name_lower = location_name.lower()

        # Broad areas (islands / named regions) must rank low so they never beat a
        # more specific city/province/coordinate (e.g. "Mindanao" vs "Maasim").
        if location_name.strip() in ISLAND_GROUPS or any(
            r.lower() == name_lower for r in self.PHILIPPINE_REGIONS
        ):
            return 'region'

        if any(keyword in name_lower for keyword in ['city', 'town', 'municipality']):
            return 'city'
        elif any(keyword in name_lower for keyword in ['province', 'region']):
            return 'province'
        elif any(keyword in name_lower for keyword in ['street', 'road', 'avenue', 'boulevard']):
            return 'street'
        elif any(keyword in name_lower for keyword in ['barangay', 'brgy', 'sitio', 'purok']):
            return 'barangay'
        else:
            return 'location'
    
    def _geocode_location(self, location_name: str, retry_count: int = 0) -> Optional[Dict]:
        """
        Get geographic coordinates for a location using Nominatim.
        Implements rate limiting (1 request/second) as per Nominatim policy.
        
        Args:
            location_name: Name of the location
            retry_count: Number of retries attempted
            
        Returns:
            dict: Geocoding result or None
        """
        if retry_count >= 3:
            logger.warning(f"Max retries reached for geocoding: {location_name}")
            return None
        
        try:
            # Rate limiting: Wait 1 second between requests (Nominatim requirement)
            current_time = time.time()
            time_since_last = current_time - self._last_geocode_time
            if time_since_last < 1.0:
                time.sleep(1.0 - time_since_last)
            
            # Add "Philippines" to query for better results
            query = f"{location_name}, Philippines" if "Philippines" not in location_name else location_name
            
            location = self.geocoder.geocode(query, exactly_one=True, language='en')
            
            self._last_geocode_time = time.time()
            
            if location:
                address = location.raw.get('address', {})
                
                return {
                    'latitude': location.latitude,
                    'longitude': location.longitude,
                    'city': address.get('city') or address.get('municipality') or address.get('town'),
                    'province': address.get('state') or address.get('province'),
                    'region': address.get('region'),
                    'country': address.get('country', 'Philippines')
                }
            else:
                logger.debug(f"No geocoding result for: {location_name}")
                return None
                
        except GeocoderTimedOut:
            logger.warning(f"Geocoding timeout for: {location_name}, retrying...")
            return self._geocode_location(location_name, retry_count + 1)
        
        except GeocoderServiceError as e:
            logger.error(f"Geocoding service error for {location_name}: {str(e)}")
            return None
        
        except Exception as e:
            logger.error(f"Unexpected geocoding error for {location_name}: {str(e)}")
            return None
    
    def _deduplicate_locations(self, locations: List[Dict]) -> List[Dict]:
        """Remove duplicate locations based on name similarity"""
        seen = set()
        unique_locations = []
        
        for loc in locations:
            loc_key = loc['location_name'].lower().strip()
            # Explicit coordinates should not be collapsed by name alone
            if loc.get('location_type') == 'coordinates':
                loc_key = f"{loc_key}_{loc.get('latitude')}_{loc.get('longitude')}"
                
            if loc_key not in seen:
                seen.add(loc_key)
                unique_locations.append(loc)

        return unique_locations

    # Directional form: "05.57°N, 124.98°E" (degree symbol optional)
    _COORD_DIRECTIONAL = re.compile(
        r"(\d{1,2}(?:\.\d+)?)\s*°?\s*([NnSs])\s*[, ;]+\s*(\d{2,3}(?:\.\d+)?)\s*°?\s*([EeWw])"
    )
    # Bare decimal pair: "14.5995, 120.9842" — conservative (>=3 decimals) so it
    # never matches magnitudes/depths/times ("7.8", "33", "7:37").
    _COORD_BARE = re.compile(
        r"(?<![\d.])(\d{1,2}\.\d{3,})\s*[, ]\s*(1[12]\d\.\d{3,})(?![\d.])"
    )

    def _best_named_location(self, named_locations: Optional[List[Dict]]) -> Optional[Dict]:
        """Label explicit coordinates with the most specific named place in the text."""
        if not named_locations:
            return None
        ranked = sorted(
            named_locations,
            key=lambda l: SPECIFICITY_RANK.get(l.get('location_type'), 2),
            reverse=True,
        )
        for loc in ranked:
            if loc.get('location_type') != 'region' and loc.get('location_name'):
                return loc
        return None

    def _extract_explicit_coordinates(
        self, text: str, named_locations: Optional[List[Dict]] = None
    ) -> List[Dict]:
        """Parse explicit lat/lng coordinates from the article text.

        Returns location dicts (type 'coordinates', confidence 0.99) for any pairs
        that fall within Philippine boundaries. This is the most precise signal in
        agency bulletins and should outrank any geocoded place name.
        """
        results: List[Dict] = []
        seen = set()

        def _add(lat: float, lng: float):
            if not _within_philippines(lat, lng):
                return
            key = (round(lat, 4), round(lng, 4))
            if key in seen:
                return
            seen.add(key)
            best_loc = self._best_named_location(named_locations)
            results.append({
                'location_name': best_loc['location_name'] if best_loc else f"{lat:.4f}, {lng:.4f}",
                'location_type': 'coordinates',
                'confidence': 0.99,
                'source': 'explicit_coords',
                'latitude': lat,
                'longitude': lng,
                'country': 'Philippines',
                'city': best_loc.get('city') if best_loc else None,
                'province': best_loc.get('province') if best_loc else None,
                'region': best_loc.get('region') if best_loc else None,
                'region_name': best_loc.get('region_name') if best_loc else None,
            })

        for m in self._COORD_DIRECTIONAL.finditer(text):
            lat = float(m.group(1)) * (-1 if m.group(2).upper() == 'S' else 1)
            lng = float(m.group(3)) * (-1 if m.group(4).upper() == 'W' else 1)
            _add(lat, lng)

        for m in self._COORD_BARE.finditer(text):
            _add(float(m.group(1)), float(m.group(2)))

        return results

    def select_primary_location(self, locations: List[Dict]) -> Optional[Dict]:
        """Pick THE hazard location: most specific first, then highest confidence.

        Explicit coordinates > street/barangay > city/municipality > province >
        region/island. Only considers entries that carry coordinates. Returns None
        when no candidate has coordinates.
        """
        candidates = [
            loc for loc in (locations or [])
            if loc.get('latitude') is not None and loc.get('longitude') is not None
        ]
        if not candidates:
            return None
        return max(
            candidates,
            key=lambda l: (SPECIFICITY_RANK.get(l.get('location_type'), 2), l.get('confidence', 0.0)),
        )


# Global GeoNER instance (FastAPI pattern - reuse across requests)
geo_ner = GeoNER()
