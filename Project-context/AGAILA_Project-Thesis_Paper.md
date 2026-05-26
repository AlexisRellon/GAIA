## COLLEGE OF INFORMATION TECHNOLOGY AND COMUTER SCIENCE

# **AGAILA: A Framework Integrating Zero-Shot Classification and Geo-NER for Natural Hazard Detection**

---

(^)
An Undergraduate Thesis
College of Information Technology and Computer ScienceSubmitted to the Faculty of the^
Lyceum of the Philippines University-Cavite
(^)
In Partial Fulfillment
of the Requirements for the Degree of
with specialization in Software EngineeringBachelor of Science in Computer Science^
(^)
**IAN M. LUMANOG
ALEXIS JOHN L. RELLON
AARON JOSHUA B. ROXAS
BEO ALVARO E. SALGUERO**
August 202 6

---

## CHAPTER I

## INTRODUCTION

**Background and Rationale of the Study**
Awareness of natural hazards is fundamental to human survival and
decision-making. Just as sight allows humans to perceive danger in their
surroundings, data awareness enables societies to respond to emerging threats in
their environment. In the digital era, much of this awareness comes from textual
information, news reports, updates, and situational bulletins that narrate real-world
events as they unfold.

For two consecutive years (2022 and 2023), the Philippines ranked first
among 180 countries with the highest overall disaster risk (NDRRMC, 2023). The
Philippines experiences an average of twenty tropical cyclones visiting the country
every year, with about 8 or 9 making landfall (NDRRMC, 2023). From 2011 to
2021, the Philippines suffered losses and damages from tropical cyclones
amounting to PHP 673.30 billion, demonstrating the severe economic impact of
natural disasters (NDRRMC, 2023). The country's location in the Pacific Ring of
Fire makes it highly vulnerable to catastrophic earthquakes, including the
potentially devastating Magnitude 7.2 earthquake known as "The Big One," which
could directly impact the highly populated Greater Metro Manila Area with


extensive infrastructure damage, widespread blackouts, and economic
turmoil (NDRRMC, 2023). When Typhoon Haiyan struck in 2013, inadequate
early warning systems and delayed information dissemination contributed to
thousands of casualties, demonstrating that timely hazard detection and coordinated
response can mean the difference between life and death. In this high-risk
environment, early detection and rapid response are critical to minimizing
casualties and damage.

**Figure 1**
Bridging the Gap from Fragmented Text to Actionable Geospatial Intelligence

However, this vast information landscape is often unstructured and
fragmented across various sources. News outlets, social media platforms, and
government bulletins produce continuous streams of disaster-related text, yet


transforming this data into a coherent understanding of what, where, and when a
hazard occurs remains a significant challenge. To bridge this gap, artificial
intelligence now extends human awareness into the digital domain, enabling
systems to automatically interpret textual data and translate it into actionable
geospatial insights Mai et al. (2022).

Despite advancements in disaster monitoring technology, existing hazard
detection systems face critical limitations. Many platforms rely heavily on manual
curation and analysis, creating a bottleneck that delays the "Time-to-Action" during
the critical first hours of an event. Current systems often lack the Automated
Geospatial Extraction capabilities required to pinpoint specific provinces or
municipalities from unstructured text, which hinders the ability of responders to
visualize affected areas in real time. Moreover, standard natural language
processing tools frequently struggle with the multilingual challenges inherent in
Philippine disaster communication. The prevalence of Filipino-English code-
switching (e.g., using "bagyong" for typhoon) and informal local toponyms creates
significant barriers for accurate text understanding in traditional models. These
gaps highlight the urgent need for an integrated AI framework, like AGAILA, that
leverages Cross-Lingual Embeddings to process diverse inputs and deliver
geographic results automatically.


This vision forms the foundation of AGAILA, an AI-driven framework that
integrates Zero-Shot Classification (ZSC) and Geospatial Named Entity
Recognition (Geo-NER) to automatically detect and locate natural hazards from
online information streams. By combining these two techniques, AGAILA can
classify hazard types without requiring thousands of labeled training examples
while simultaneously extracting location entities such as provinces, cities, and
regions from news articles and citizen reports. The system then validates these
locations against authoritative Philippine administrative boundaries from the
National Mapping and Resource Information Authority (NAMRIA, 2024) and
visualizes them on an interactive web map, enabling stakeholders to see unfolding
hazards as they are reported.

AGAILA seeks to accomplish three primary objectives: first, to enable real-
time hazard identification from unstructured text sources such as RSS news feeds
and citizen reports; second, to perform automated geolocation extraction that maps
hazards to specific Philippine provinces, cities, and regions; and third, to provide
immediate situational awareness through an interactive web-based map that
displays detected hazards within minutes of their online publication. By reducing
the Time-to-Action from hours to minutes, AGAILA aims to transform how
disaster information flows from detection to response.


The primary beneficiaries of AGAILA are disaster response agencies, Local
Government Units (LGUs), and emergency management personnel who require
rapid situational awareness during crises. The National Disaster Risk Reduction
and Management Council (NDRRMC) and provincial disaster offices can use
AGAILA to monitor hazards across multiple regions simultaneously, something
impossible through manual monitoring alone (NDRRMC, 2023). Environmental
monitoring institutions benefit from the system's ability to track hazard patterns
over time, supporting risk assessment and preparedness planning. Early warning
systems can integrate AGAILA's automated detection capabilities to trigger alerts
when hazards are identified near vulnerable communities. Researchers in disaster
informatics gain access to a validated framework for processing Philippine disaster
text, including performance benchmarks on real news articles. Ultimately,
AGAILA improves decision-making by ensuring that the right responders receive
accurate, geolocated hazard information at the right time, enabling faster
deployment of emergency resources and potentially saving lives.

From a computing perspective, this study makes significant contributions
to the field of computer science and information technology. AGAILA advances
applied artificial intelligence and natural language processing by demonstrating
how Zero-Shot Classification (ZSC) can be effectively integrated with Geospatial
Named Entity Recognition (Geo-NER) to process disaster-related text. This


approach achieves high hazard detection accuracy on real Philippine news articles
without requiring thousands of labeled training examples for each category,
leveraging the semantic transfer capabilities inherent in modern ZSC frameworks
(Pourpanah et al., 2022). The framework contributes to geospatial computing by
transforming unstructured, multilingual text into geocoded environmental
intelligence. It addresses the technical challenge of extracting and validating
Philippine location names from code-switched English-Filipino text through a
hybrid approach that combines transformer-based entity recognition with rule-
based pattern matching against official NAMRIA administrative boundaries,
aligning with recent advancements in Geo-AI location encoding (Mai et al., 2022).
The system demonstrates an end-to-end computing pipeline from model inference
(using transformer-based language models) to geospatial validation (using PostGIS
spatial database operations) to web-based visualization (through a Progressive Web
App), representing a novel interdisciplinary computing solution that bridges natural
language processing, geographic information systems, and web technologies. This
integration shows that the study is not only socially relevant but also contributes to
advancing computing theory and practice by providing a replicable architecture for
building AI-driven situational awareness systems in resource-constrained,
multilingual environments.


**Objectives of the Study**
To design, develop, and evaluate AGAILA, an AI-driven framework that
leverages ZSC and Geo-NER to automatically detect and locate natural hazards
from online information streams in near real-time.
● To collect and preprocess textual information from online sources
for natural hazard reporting.
● To implement a ZSC model capable of detecting previously unseen
hazard categories in textual data.
● To integrate Geo-NER for automatic extraction of location-specific
information from hazard reports.
● To develop a system that visualizes detected hazards on a geospatial
map for decision-making purposes.
● To evaluate the performance of AGAILA in terms of accuracy,
timeliness, and usability for real-world natural hazard detection

**Significance of the Study**
Effective disaster management relies on timely detection and response to
natural hazards. AGAILA (Geospatial AI-Driven Assessment) addresses this need
by applying Zero-Shot Learning (ZSL), an AI approach that enables


models to recognize categories they have never seen during training. For instance,
a ZSL model trained on "floods" and "earthquakes" can detect "landslides" by
leveraging shared semantic attributes and high-level descriptors, allowing the
system to generalize to unseen disaster types without requiring new labeled data
(Pourpanah et al., 2022). This capability allows AGAILA to rapidly identify
emerging hazards, reducing potential loss of life and property in unpredictable
disaster scenarios.

By integrating ZSL with Geospatial Named Entity Recognition (Geo-NER),
AGAILA transforms unstructured textual reports into actionable geospatial insights
in near real-time. This automation improves situational awareness, supports faster
decision-making, reduces manual workload, and ensures comprehensive coverage
across multiple information sources.
**The main beneficiaries of AGAILA include:**

- Local Government Units (LGUs) and national disaster response
    agencies (NDRRMC, provincial/municipal DRRMOs): Receive
    jurisdiction-specific hazard alerts, visualize hazard distribution via
    a Progressive Web App (PWA), and prioritize resources efficiently.
- Filipino citizens, particularly in disaster-prone areas: Contribute
    hazard reports through a participatory citizen reporting system,
    creating a community-based early warning mechanism. Citizen


```
reports, especially from rural areas with limited monitoring, enhance
coverage and response times.
```
- Academic and technological communities: Gain insights into the
    novel application of ZSC for textual hazard detection and a
    replicable AI-geospatial pipeline for real-time disaster monitoring.
- Research proponents: Strengthen competencies in AI, multilingual
    NLP, geospatial database design, cloud deployment, full-stack
    development, and ethical system deployment.
- Future researchers: Can replicate and extend AGAILA’s framework
    for other hazards, languages, regions, and data sources, contributing
    to AI-driven disaster management innovation and national resilience
    strategies.
Overall, AGAILA demonstrates a practical, innovative, and academically
relevant solution that bridges AI, geospatial computing, and community
participation, establishing a foundation for future advances in disaster preparedness
and response.

**Scope and Limitation**
The scope of this study focuses on the detection and geolocation of natural
hazards using textual information streams. This study also


contributes to AI and geospatial computing by demonstrating how Zero-Shot
Classification (ZSC) and Geo-Named Entity Recognition (Geo-NER) can be
applied for real-time hazard detection, providing a framework that bridges
unstructured data and actionable geospatial intelligence. AGAILA is designed to
process online reports, news articles, and RSS feeds to automatically identify
hazards and their corresponding locations. The system integrates ZSC to recognize
hazard types that may not have been included in its training data, allowing it to
detect new or emerging threats. Additionally, Geo-NER enables the extraction of
precise location information from unstructured text, facilitating the visualization of
hazards on a map. For this study, AGAILA primarily focuses on hazards such as
floods, landslides, fires, and other disasters commonly affecting the Philippines.
This study emphasizes near real-time processing of information to provide timely
insights that support disaster management agencies, local government units
(LGUs), and emergency responders in decision-making, resource allocation, and
rapid situational assessment. However, its effectiveness depends on the availability
and timeliness of online reports; hazards that occur in unreported areas or prior to
system deployment may not be detected.

**The system is limited in several aspects:**

- **Dependence on textual sources:** AGAILA relies solely on online reports,
    news articles, and RSS feeds. Areas with limited reporting, low internet


```
access, or delayed updates may result in undetected hazards. Additionally,
reliance on citizen-submitted reports may introduce potential inaccuracies,
and measures must be taken to ensure privacy and prevent misinformation.
```
- **Source quality and clarity:** The accuracy of hazard detection depends on
    the structure and clarity of the text. Ambiguous, incomplete, or poorly
    written reports may reduce the precision of hazard classification and
    geolocation.
- **Geographic and linguistic scope:** While ZSC allows detection of
    previously unseen hazard types, AGAILA is primarily trained on the
    Philippine context and supports English, Filipino, and Taglish. Hazards
    reported in other countries or in languages outside this range may not be
    classified accurately, which may affect detection comprehensiveness.
- **Predictive and sensor limitations:** AGAILA does not include predictive
    modeling of hazards or integrate with physical sensor networks. Its scope is
    limited to detection and mapping of reported events, without forecasting
    future occurrences or monitoring real-world conditions through IoT or
    satellite data.
- **Geocoding limitations:** Location extraction may be incomplete for
    informal place names, local landmarks, or non-standard administrative
    references, which could affect map accuracy at the barangay or municipal
    level.


## CHAPTER II^

## REVIEW OF RELATED LITERATURE

**Emergency and Disaster Reporting Systems**
Emergency and disaster reporting systems have evolved significantly over
the past decades, transitioning from manual and reactive methods to more
integrated, technology-driven platforms. Traditionally, emergency reporting relied
on telephone hotlines and SMS-based systems that allowed citizens and local
authorities to communicate incidents directly to emergency management offices.
While these systems were essential in establishing communication lines during
crises, they often suffered from limitations such as delayed response times, network
congestion, and a lack of geospatial accuracy. Recent advancements emphasize a
shift toward proactive and inclusive frameworks that integrate multi-source data to
overcome these traditional bottlenecks (UNDRR, 2023).

With the growing role of Information and Communication Technology
(ICT), many countries, including the Philippines, have begun adopting more
advanced reporting platforms that utilize mobile applications, cloud-based systems,
and geospatial analytics to enhance disaster management operations (UN ESCAP,
2024). These digital systems enable faster information exchange, facilitate data


integration across agencies, and improve the coordination of emergency response
activities. The introduction of automated data pipelines and real-time dashboards
has further strengthened situational awareness, allowing responders to make
informed decisions during disasters (UNDRR, 2023).

However, despite these technological advancements, challenges persist in
ensuring the timeliness, reliability, and accessibility of emergency data. Many
reporting platforms still rely on structured inputs and pre-defined templates,
limiting their ability to process unstructured or spontaneous reports from diverse
information sources. Furthermore, developing countries face additional barriers
such as limited ICT infrastructure, inconsistent internet connectivity, and gaps in
interoperability among government systems (UN ESCAP, 2024). These challenges
highlight the ongoing need for intelligent, adaptive systems that can process
heterogeneous data sources and support rapid decision-making during emergencies.
The limitations found in traditional reporting frameworks underscore the necessity
for a more comprehensive integration of Information and Communication
Technology (ICT), which serves as the foundational infrastructure for modern
disaster risk reduction and management strategies.

**Role of ICT in Disaster Risk Reduction and Management**
Information and Communication Technology (ICT) plays a crucial role in
strengthening disaster risk reduction and management (DRRM) by enhancing the


collection, processing, and dissemination of critical information during all phases
of a disaster, from preparedness to recovery. Modern ICT tools, such as remote
sensing, Geographic Information Systems (GIS), cloud computing, and artificial
intelligence, have transformed how disaster data is gathered and analyzed, enabling
faster and more informed decision-making.These technologies facilitate real-time
data sharing across agencies, ensuring that emergency response teams, local
governments, and national authorities operate with a unified and updated situational
picture.

In the Philippines, ICT has been at the core of national disaster management
efforts, particularly through initiatives led by the National Disaster Risk Reduction
and Management Council (NDRRMC). Systems such as Project NOAH and
GeoRiskPH have demonstrated how integrating ICT with hazard modeling and
geospatial analytics can improve forecasting accuracy and risk communication.
These platforms not only collect environmental data from satellites and sensors but
also visualize potential hazard zones, allowing communities to take preventive
actions before disasters strike.

Moreover, ICT enhances coordination and transparency in post-disaster
response by supporting digital communication, resource tracking, and information
dissemination to affected communities (UN ESCAP, 2024). While these ICT
frameworks provide the necessary infrastructure for data sharing and visualization,


the increasing volume of unstructured disaster data necessitates the integration of
Artificial Intelligence (AI) to automate complex analytical tasks.

**AI Applications in Disaster Management**
Artificial intelligence (AI) has become an essential tool in disaster
management, enhancing the ability of authorities to predict, monitor, and respond
to crises efficiently. By automating the analysis of large volumes of heterogeneous
data, AI helps reduce response times, improve situational awareness, and optimize
resource allocation. While traditional satellite-based monitoring systems suffer
from critical orbital delays and urban line-of-sight obstructions, Havas and Resch
(2021) establish that analyzing user-generated text via Natural Language
Processing (NLP) effectively bridges this operational blind spot. By treating
unstructured public text as a real-time, in situ sensor network, NLP frameworks
achieve higher spatiotemporal resolution during the crucial initial hours of a crisis.
Building upon this paradigm, AGAILA utilizes advanced Zero-Shot Classification
to extract actionable hazard intelligence from fragmented reporting, drastically
reducing emergency response latency.

One promising approach within AI is Zero-Shot Classification (ZSC),
which allows systems to identify categories or hazards that were not explicitly
included in the training data. Unlike traditional supervised learning, ZSC leverages
semantic representations, knowledge graphs, or attribute-based embeddings to infer


labels for unseen classes. This approach mimics the human ability to generalize
from prior knowledge to novel situations by mapping input features to a high-
dimensional semantic space where seen and unseen classes share common
characteristics (Pourpanah et al., 2022). In disaster management, this capability is
critical because new types of hazards or variations in reports can emerge suddenly,
and labeled datasets for every possible scenario are often unavailable.

Another key AI application is Geospatial Named Entity Recognition (Geo-
NER), which extracts location-specific information from unstructured text and
converts it into structured geospatial data. This enables the creation of dynamic
hazard maps and dashboards that provide real-time situational awareness for
responders and decision-makers. Recent advancements in Geo-AI have moved
beyond simple keyword matching, utilizing deep learning architectures to resolve
linguistic ambiguities and map place names to precise coordinates with high
accuracy (Mai et al., 2022).

By combining ZSC with Geo-NER, systems can automatically interpret textual
information and identify both the type of hazard and its geographic location,
bridging the gap between raw reports and actionable intelligence.

AI-driven prioritization and risk assessment frameworks further enhance
emergency response by ranking incidents based on urgency, severity, or potential
impact, ensuring that critical resources are deployed effectively Ghaffarian et al.


```
(2023). Integrating these technologies into a unified system allows disaster
management agencies to move from reactive to proactive operations, ultimately
reducing response times, mitigating losses, and improving community resilience
Learning Paradigms for Text Classification
```
(^) Text classification tasks in natural language processing (NLP) rely on
different learning paradigms depending on the availability of labeled data and the
nature of the task. The three major paradigms commonly discussed in the literature
are supervised learning, unsupervised learning, and zero-shot learning.
**Supervised learning** remains the dominant approach in machine learning,
where models are trained using labeled datasets. Each input is paired with a target
output, and the model learns mappings through loss minimization and adaptive
gradient optimization algorithms.. Supervised learning includes classic algorithms
like Random Forest, Support Vector Machines, Logistic Regression, and modern
fine-tuned transformer models such as BERT, RoBERTa, and DeBERTa.
**Unsupervised learning** detects structure in unlabeled data, relying on
statistical regularities rather than ground-truth labels. Algorithms such as k-means
clustering, principal component analysis (PCA), and autoencoders continue to be
foundational for tasks like dimensionality reduction, anomaly detection, and
representation learning. While unsupervised learning detects statistical structure
without explicit supervision, its lack of task-specific alignment renders it


```
suboptimal for critical disaster response. Consequently, modern Natural Language
Processing increasingly operationalizes Zero-Shot Learning (ZSL), leveraging
large pretrained language models to classify emergent hazards without task-specific
labeled data.
```
```
Zero-shot learning has become increasingly influential due to the rise of
large pretrained language models (LLMs), including DeBERTa-MNLI, FLAN-T5,
and ClimateNLI (He et al., 2021; Chung et al., 2022). In zero-shot classification,
the model predicts labels for a task without accessing any task-specific labeled data.
Instead, it leverages knowledge acquired from pretraining, particularly on Natural
Language Inference (NLI) datasets such as MNLI. Although zero-shot learning
does not require labeled data for the target task, it is not purely unsupervised
because the models themselves are pretrained on large supervised corpora. Recent
research shows that performance can be improved through techniques such as
Augmented Label Prompting (Hong et al., 2023), verbalizer engineering (Schick &
Schütze, 2021), and instruction-based prompt tuning (Chung et al., 2022). These
methods enrich label descriptions and provide clearer task formulations, enabling
LLMs to generalize more effectively without retraining.
```
**Table 1**
Comparison of Learning Paradigms


Aspect Supervised Learning Unsupervised Learning Zero-Shot Learning
Definition Model learns from
labeled data to map inputs to outputs
Model learns patterns
or structure from unlabeled data
Model predicts
labels on new tasks without labeled
examples, using
pretrained
knowledge
Data Requirement Requires large
labeled datasets
Requires only
unlabeled datasets
No labeled
examples for the
target task; model is
pretrained
Model Update Weights updated via backpropagation Weights or clusters updated via
unsupervised
algorithms

```
Weights frozen; inference only
```
Learning Type Supervised Unsupervised Inference using
pretrained
knowledge

Examples Random Forest,
SVM, Logistic
Regression, BERT
fine-tuning

k-means, PCA,
Autoencoders
DeBERTa-MNLI
classifying new
labels without fine-
tuning
Label Usage Labeled data required No labels used No labels for this task; may use
descriptive labels in
prompts
Training on Task? Yes Yes No, uses pretrained
model only

Advantages High accuracy if
enough labeled data
Can discover hidden
structure; no labeling
cost

```
Works without task-
specific labels; fast
deployment
```

Disadvantages Labeling is costly;
not scalable to new
tasks

```
May not align with
real-world tasks; less
interpretable
```
```
Lower accuracy
than task-specific
fine-tuned models;
depends on pretrained
knowledge
Table 1 presents a clear comparison of the three main machine learning
paradigms: supervised learning, unsupervised learning, and zero-shot learning. The
table outlines their differences in data requirements, model behavior, learning
processes, and common algorithm examples. Supervised learning depends on
labeled datasets and task-specific training, while unsupervised learning identifies
structure or patterns from unlabeled data. Zero-shot learning operates by using
pretrained knowledge to make predictions on new tasks without additional training.
This comparison helps explain why zero-shot methods are useful in situations
where labeled data is limited, while also showing how they differ from models that
are trained directly on the target task.
```
```
Zero-Shot Text Classification
Zero-Shot Classification (ZSC) is a machine learning technique that enables
models to classify text into categories without having seen labeled examples of
those categories during training. This capability is particularly valuable in disaster
management, where new types of incidents or hazards can emerge unexpectedly,
and labeled datasets may be scarce or nonexistent. ZSC leverages semantic
representations, such as embeddings from pre-trained language models, to infer the
appropriate category for unseen text based on descriptive labels or natural language
```

prompts (Fan, W., & Liu, X., 2021).

The theoretical foundation of zero-shot learning rests on the ability to transfer
knowledge from seen classes to unseen classes through intermediate semantic
representations. As demonstrated by Pourpanah et al. (2022) in their comprehensive
evaluation of zero-shot learning approaches, the effectiveness of ZSC critically
depends on the quality of semantic embeddings and the structural alignment
between feature distributions and high-level class descriptors. This alignment
ensures that the model can effectively bridge the "gap" between raw unstructured
data and conceptual categories, a process central to the robustness of cross-domain
knowledge transfer. Their work established benchmark evaluation protocols that
distinguish between classical zero-shot learning (where test classes are completely
disjoint from training classes) and generalized zero-shot learning (where both seen
and unseen classes may appear during inference), a distinction highly relevant to
disaster management, where systems must recognize both known hazard types and
novel incident categories.

In the context of disaster management, ZSC allows for the automatic
classification of unstructured textual data, such as social media posts, news articles,
or emergency reports, into predefined hazard categories. This facilitates the rapid
identification and prioritization of emerging incidents, enabling timely and
coordinated responses. For instance, a ZSC model can classify a tweet about a
sudden flood in a previously unaffected area, even if the model has not been


explicitly trained on flood-related data. The Generalized Zero-Shot Learning
(GZSL) paradigm described by Pourpanah et al. (2022) is particularly applicable
here: AGAILA's ZSC implementation must handle both familiar hazard types
encountered during model pre-training (such as typhoons and earthquakes) and
novel or rare environmental threats that may not have been explicitly included in
the training corpus. This dual capability ensures the system remains robust in real-
world scenarios where seen and unseen classes appear interchangeably in
unstructured data streams.

Recent advancements in ZSC have demonstrated its effectiveness in various
domains, including crisis informatics and emergency response. As established by
Rondinelli et al. (2022), zero-shot frameworks successfully navigate the linguistic
noise and ambiguous hazard definitions inherent in public text streams, achieving
high classification accuracy. To mitigate the zero-shot degradation observed in
commercial LLMs when confronted with ambiguous disaster categories
(McDaniel, 2024), AGAILA operationalizes DeBERTa-v3 using strictly
engineered NLI hypothesis templates. The transition from attribute-based zero-shot
learning (where classes are described by predefined attributes) to text-based zero-
shot classification (where natural language descriptions serve as class definitions)
has proven especially powerful for NLP tasks. As established by Pourpanah et al.
(2022), the architectural choice of semantic representation dictates the efficacy of
zero-shot knowledge transfer. To avoid the human bias inherent in engineered
attribute spaces, AGAILA leverages the learned semantic space of DeBERTa-v3,


```
utilizing its disentangled attention mechanism to map complex, code-switched
disaster text directly to predefined NLI hypothesis templates. In AGAILA's case,
utilizing natural language hazard descriptions (e.g., "flooding," "typhoon") as class
labels, rather than hand-crafted attribute vectors, enables the model to leverage the
rich, high-dimensional semantic knowledge already encoded in pre-trained
language models. This approach reduces human bias in attribute selection and
allows the system to tap into a broader contextual understanding of environmental
threats.
```
**Table 2**
Neutral Model Comparison Matrix for Zero-Shot & NLI Applications
Aspect DeBERTa-
v3 (MNLI)
RoBERTa-
Large MNLI
FLAN-T5 Climate
NLI
ZeroPerformance-Shot Strong, but varies by
domain

```
Strong ModerateHigh –
(prompt-
dependent)
```
```
Moderate; climate-
domain
optimized
```
NLI Strength High MNLI
performance
Stable NLI;
mature
Good when
prompted
correctly

```
Good
within
climate
context
```

Architecture
Advantage
Disentangled
attention
improves
some benchmarks

```
Robust
transformer
encoder
```
```
Highly
flexible
generative
model
```
```
Optimized
for
climate
science text
```
Domain Adaptation
Potential

```
Responds well to fine-
tuning but
may overfit
if data is
small
```
```
Stable finetuning; -
mature
```
Susceptible to forgetting Strong within
climate
science,
limited
outside
Robustness to
Noisy Text
Good, based
on
benchmarks

```
Moderate–
Good
Highly
prompt
sensitive
```
```
Moderate
in climate
domain
```
Computational Cost Medium efficiency High compute cost Medium compute cost LightMedium–

Strengths Balanced
performance
across tasks

```
Very stable
NLI model
Good
generalization
ability
```
Excellent
climate-
specific
reasoning
Limitations Not the fastest
model;
performance
varies across
tasks

```
Heavy; older architecture Output varies with
prompting
```
```
Poor general
hazard
diversity
```
Best Use Case General NLI
+ domain
adaptation

```
Stable NLI
classification
Few-shot +
instruction
following
```
```
Climate
hazard &
climate
science
analysis
```
```
Table 2 provides a balanced comparison of five candidate models
commonly used for zero-shot and NLI-based classification tasks: DeBERTa-v3,
```

RoBERTa-Large MNLI, FLAN-T5, and ClimateNLI. The table outlines each
model’s performance in zero-shot settings, strengths in Natural Language
Inference, domain adaptation potential, robustness to noisy text, and computational
cost. Encoder-only models like DeBERTa and RoBERTa excel in stable NLI
classification (He et al., 2021), while encoder-decoder models such as FLAN-T5
provide robust flexibility for mixed generative and classification-based zero-shot
inference (Chung et al., 2022), their heavy computational cost remains suboptimal
for real-time disaster triage. Consequently, the AGAILA framework strategically
operationalizes the encoder-only DeBERTa-v3 to optimize inference latency and
enforce rigorous Natural Language Inference (NLI) stability. ClimateNLI performs
best for climate-related text but is less generalizable to broader domains (Yudanto
et al., 2024).

DeBERTa is chosen for AGAILA because it offers strong zero-shot and
NLI performance across domains (He et al., 2021), is robust to noisy textual inputs
due to its disentangled attention mechanism and enhanced mask decoder, and
supports domain adaptation through efficient fine-tuning methods demonstrated in
multiple benchmarks (He et al., 2021). This balance of generality, performance, and
adaptability makes DeBERTa well-suited for classifying diverse disaster-related
reports while maintaining high accuracy and computational efficiency. While Zero-
Shot Classification identifies the nature of a disaster, it must be complemented by
Named Entity Recognition (NER) and Geo-NER to anchor that information to a
specific geographic context.


**Named Entity Recognition (NER) and Geo-NER**
Named Entity Recognition (NER) is a fundamental natural language
processing (NLP) technique that identifies and classifies entities within text into
predefined categories such as persons, organizations, dates, and locations (Jurafsky
& Martin, 2024). In the context of disaster management, NER is particularly
valuable for extracting critical information from unstructured textual sources such
as news articles, emergency bulletins, and social media posts. By automatically
detecting mentions of hazards, affected areas, or key actors, NER enables systems
to convert fragmented textual information into structured data that can support
timely decision-making.

Geospatial Named Entity Recognition (Geo-NER) extends traditional NER
by specifically focusing on geographic entities and locations mentioned in text.
Geo-NER identifies place names, coordinates, and administrative regions, which
can then be mapped onto digital platforms such as GIS dashboards for real-time
situational awareness. This is crucial in disaster management, as knowing where a
hazard occurs is just as important as knowing what has happened. Modern Geo-AI
frameworks emphasize that the theoretical capabilities of standard geographic
extraction must be refined through a Hybrid Geo-NER Approach for the Philippine
Context to account for the specific linguistic and administrative complexities—
such as colloquial landmark names and overlapping barangay boundaries—unique
to local disaster reporting (Mai et al., 2022).


**Hybrid Geo-NER Approach for Philippine Context**
The AGAILA system implements a hybrid Geo-NER approach that
combines deep learning-based entity recognition with rule-based pattern matching
and geographic validation, specifically optimized for Philippine locations and
linguistic characteristics. This multi-stage approach addresses the unique
challenges of Philippine disaster reporting, including code-switching between
English and Filipino, regional dialects, homonymous place names, and informal
location references. Once the hybrid extraction process successfully resolves
geographic coordinates, these data points must be rendered through Real-Time
Geospatial Visualization to provide an intuitive and actionable interface for disaster
management personnel.


```
System
Name
Core NER
Model
Gazetteer /
Regex
Layer
```
## PH

```
Normalization
```
## PH

```
Boundary
Validation
```
```
Expected Benefit
/ Baseline Role
Rule-
based
only
```
None Yes Optional Optional **Interpretability:**
High precision
for known place
lists, but very low recall for
informal or
misspelled
names.
Geo-NER dslim/bertNER - base- No No No **Model Baseline:** Pure deep
learning; good at
finding
"locations"
generally, but fails on toponym
disambiguation
and local codes.
Geo-NER
Hybrid
dslim/bert-base-
NER
Yes Yes Yes **Proposed
System:** Optimized for
PH; bridges the
"semantic gap"
by validating
results against PH
administrative
boundaries
(PSGC).
spaCy Baseline en_core_web_trf No No No **Industry Baseline:** Off-
the-shelf
alternative; often
used for
comparison because of its
balanced F1-
scores (~0.85-
0.90) in general
tasks.^


**Real-Time Geospatial Visualization**
Real-time geospatial visualization refers to the dynamic
representation of spatial data as events occur, enabling decision-makers to monitor,
analyze, and respond to emerging situations effectively. In disaster management,
this capability is crucial for providing situational awareness to emergency
responders, local government units, and the public. By visualizing hazards on
interactive maps, stakeholders can quickly identify affected areas, assess the scale
of impact, and prioritize resource allocation. Modern frameworks now advocate for
Digital Risk Twins, which integrate these real-time visual feeds with simulation-
based insights to provide a more comprehensive and proactive decision-support
environment (Ghaffarian, 2023).

Modern platforms for real-time geospatial visualization often integrate
Geographic Information Systems (GIS), web mapping frameworks such as Leaflet
or Mapbox, and live data streams from sensors, satellites, or online reports. These
tools allow users to interact with the data, filter layers, and gain insights into
evolving hazard scenarios. As demonstrated by Havas and Resch (2021),
dynamically mapping flood-affected zones alongside local infrastructure data
empowers authorities to bypass traditional communication bottlenecks, enabling
the rapid coordination of evacuation routes and the targeted deployment of
emergency resources.


In the context of AGAILA, real-time geospatial visualization is the final
output of the system, transforming unstructured textual information into actionable
maps. By combining Zero-Shot Classification (ZSC) for hazard detection and Geo-
NER for location extraction, AGAILA can generate real-time hazard maps from
online information streams, providing a comprehensive view of emerging
environmental threats. This integration not only enhances situational awareness but
also supports proactive disaster management and decision-making.

Challenges in real-time visualization include handling high-volume data
streams, ensuring map accuracy, and maintaining low latency for timely updates.
Nevertheless, advancements in cloud computing, geospatial analytics, and
automated data pipelines continue to improve the feasibility and reliability of real-
time hazard mapping systems. The technical feasibility of these mapping systems
is best understood by examining Local and International Case Studies, which
demonstrate how such visualization frameworks have been operationalized within
both global and Philippine disaster management contexts.

**Local and International Case Studies**
Analyzing local and international case studies provides valuable insights
into how disaster reporting and hazard detection systems have been implemented,
highlighting successes, challenges, and lessons applicable to the Philippine context.


In the Philippines, Project NOAH (Nationwide Operational Assessment of
Hazards) serves as a flagship disaster risk reduction and management (DRRM)
platform. Developed by the Department of Science and Technology (DOST),
NOAH integrates satellite data, weather forecasts, and hydrological models to
generate real-time hazard maps and early warning alerts. The platform has
demonstrated significant effectiveness in monitoring floods, typhoons, and
landslides, providing local governments and communities with actionable
information to mitigate disaster risks.

Internationally, hazard intelligence systems demonstrate strong capabilities
in geospatial modeling, historical hazard visualization, and scenario-based risk
assessment. One prominent example is the NCEI/NOAA Hazards Map, which
aggregates global historical and real-time geophysical data such as storms,
earthquakes, rainfall, and wildfires. Its primary strength lies in providing scientists
and policymakers with sensor-based numerical observations and satellite-derived
measurements that support large-scale situational awareness. However, its outputs
remain largely descriptive and visual, relying on human expertise to interpret the
events presented, especially when dealing with textual reports from the field. The
platform does not incorporate automated NLP-based analysis, meaning
unstructured data, often the earliest indicators of developing hazards, cannot be
processed directly.


Another important international system is InaSAFE, a tool used primarily
in Southeast Asia tosimulate the impact of disaster scenarios on communities,
infrastructure, and populations. InaSAFE integrates geospatial data layers (e.g.,
shapefiles, population density, infrastructure networks) and uses deterministic
models to estimate hazard impacts. Its utility lies in planning, preparedness, and
post-disaster assessment rather than real-time event detection. Like NCEI/NOAA,
InaSAFE requires structured GIS inputs and cannot analyze unstructured textual
sources such as news flashes, reports, or social media updates. This limitation
highlights a wider global pattern: leading international hazard platforms excel at
modeling and visualization but lack automated semantic understanding of text.
These gaps underscore the novelty of AGAILA’s approach, which incorporates
Zero-Shot Classification and Geo-NER to process unstructured textual streams,
capabilities not found in either NCEI/NOAA Hazards Map or InaSAFE.
These case studies reveal that integrating multiple data sources with real-
time analysis and geospatial mapping significantly enhances situational awareness
and decision-making. AGAILA builds upon these lessons by focusing on
unstructured textual data streams, applying Zero-Shot Classification for hazard
detection, and using Geo-NER for location extraction. By doing so, it addresses a
gap in automated, location-aware hazard monitoring in the Philippines,
complementing existing systems while extending capabilities to previously unseen
or under-reported hazards


**Table 3**
Comparative Analysis of Hazard Intelligence Systems
Criterion NCEI/NOAA
Hazards Map
InaSAFE Project NOAH
(Philippines)

## AGAILA

```
(Proposed
System)
System Type Data
Visualization
/ Observation
```
```
Geospatial Risk
Modeling
Hazard Assessment /
Forecasting Tool
Zero-Shot
NLP
Classification
Core
Function
Visualizes
global
historical and
realgeophysical -time
data (e.g.,
storms,
rainfall).
```
```
Predicts the
impact of a
defined disaster
scenario.
```
```
Assesses likelihood of
floods, landslides, and
storm surges and
provides realtyphoon tracking.-time
```
```
Categorizes
unseen raw
text (news,
public citizen report ) into
specific
Philippine
hazard types.
Input Data Numerical
sensor data,
satellite feeds, weather
station
records.
```
```
Geospatial data
(shapefiles,
infrastructure layers,
population
density).
```
```
Numerical data (rainfall
gauges) and graphical
data (typhoon tracks).
```
```
Unstructured
text (RSS
news feeds, forms
reports).
Prediction Forecasting (numerical
output).
```
```
Impact Assessment
(spatial output).
```
```
Forecasting (weather updates) and Hazard
Mapping (likelihood).
```
```
Topic Classification
(Entailment
Score) and
Information
Triage.
Limitation Provides raw
numerical data; requires
human
expertise to
interpret text
reports.
```
```
Not real-time;
requires structured GIS
input and does
not process raw
text.
```
```
Focuses on
geospatial/meteorological data; does not automate
the analysis or
classification of raw
textual reports.
```
```
Classification
accuracy is heavily
dependent on
the quality
design.
```
(^)


Table 3 presents a comparative analysis of four hazard intelligence systems,
NCEI/NOAA Hazards Map, InaSAFE, Project NOAH, and the proposed AGAILA
framework. The comparison highlights key differences in system type, core
functionality, input data, predictive capabilities, and limitations. Traditional
systems such as NCEI/NOAA, InaSAFE, and Project NOAH primarily rely on
structured geospatial or numerical sensor data for visualization, impact modeling,
and hazard forecasting. In contrast, AGAILA introduces an NLP-driven approach
that focuses on processing unstructured textual reports through Zero-Shot
Classification and Geo-NER. The table underscores how existing tools excel in
geospatial and sensor-based monitoring but lack automated semantic interpretation
of text, an innovation that AGAILA directly addresses.


**Conceptual Framework
Figure 2**
Input-Process-Output (IPO)


**Definition of Terms
PWA (Progressive Web Application)** – A type of application software
delivered through the web, built using standard web technologies, that offers an
app-like user experience such as offline functionality, push notifications, and home-
screen installation.
**Artificial Intelligence (AI)** - A field of computer science focused on
creating systems or machines capable of performing tasks that typically require
human intelligence, such as reasoning, learning, problem-solving, perception, and
natural language understanding.
**Machine Learning (ML)** - A branch of artificial intelligence (AI) that
enables systems to automatically learn and improve from experience without being
explicitly programmed, by analyzing data and identifying patterns.
**Large Language Model (LLM)** - A type of AI model trained on vast
amounts of text data, designed to understand, generate, and process natural
language.
**Zero-shot Learning (ZSL)** - A machine learning approach where a model
can correctly recognize or classify data from classes it has never seen during
training, by leveraging semantic relationships or descriptions.

**Few-shot Learning (FSL)** - A machine learning technique where a model
can generalize to new tasks using only a small number of labeled training examples,
instead of requiring large datasets.


**Dijkstra’s Algorithm** – A graph search algorithm that finds the shortest
path between nodes in a weighted graph, widely used in network routing and
pathfinding applications.
**API (Application Programming Interface)** – A set of rules and protocols
that allows different software applications to communicate with each other,
enabling the integration and reuse of functionalities across platforms.
**Project NOAH (Nationwide Operational Assessment of Hazards)** – A
disaster risk reduction and management initiative originally launched by the
Department of Science and Technology in 2012, and later adopted by the University
of the Philippines. It provides real-time hazard maps and risk assessments for
floods, storm surges, and landslides to enhance disaster preparedness and resilience
**Disaster Risk Reduction and Management (DRRM) –** A framework of
policies and practices aimed at reducing disaster risks through prevention,
preparedness, response, and recovery activities.
**Named Entity Recognition (NER) –** A natural language processing
technique used to identify and categorize entities in text, such as people,
organizations, and locations.

**Geographic Named Entity Recognition (Geo-NER) –** An extension of
NER that links identified place names in text to geographic coordinates for mapping
and situational awareness.
**Zero-Shot Classification (ZSC) –** A machine learning method that
categorizes text into labels without requiring prior labeled training data.


**Natural Language Processing (NLP) –** A field of artificial intelligence
focused on enabling machines to understand and process human language.
**Multi-Channel Data Ingestion –** The integration of information from
various input sources such as SMS, social media, and mobile applications into a
unified processing pipeline.
**Geospatial Visualization –** The presentation of location-based data in
visual formats such as maps and dashboards to aid decision-making in crisis
contexts.


## CHAPTER III^

## METHODOLOGY

**Research Design**
This study employs an applied experimental research design, supported by
an iterative Systems Development Life Cycle (SDLC), to engineer and empirically
validate the AGAILA framework. The experimental approach facilitates a rigorous
comparative evaluation of the proposed AI pipeline against established natural
language inference baselines using standard classification metrics: Accuracy,
Precision, Recall, and F1-score.
The research is formally bifurcated into two primary methodological domains:

1. **System Engineering and Integration** : The software architecture is constructed
utilizing an Agile development methodology. This iterative approach allows for the
continuous refinement and integration of the Zero-Shot Classification (ZSC) and
Geospatial Named Entity Recognition (Geo-NER) modules inside containerized
environments. Feedback from each sprint informs the adjustment of the heuristic
confidence thresholds and the Jaccard deduplication pipeline prior to final
deployment.


2. **Empirical Model Evaluation** : To prove the scientific validity of the framework,
the AI modules undergo strict quantitative benchmarking via a comparative
baseline study. The performance of the primary ZSC model (DeBERTa-v3) and its
fallback hierarchy is evaluated against a reserved, human-annotated dataset of
Philippine natural hazard reports. Concurrently, the study conducts an ablation
analysis on the spatial extraction module, comparing a baseline bert-base-NER
model against the custom Hybrid Geo-NER pipeline (augmented with Philippine
administrative boundary validation). This ensures all active algorithms strictly
satisfy the mandated operational thresholds (Hazard F1-score > 0.80; Geo-NER F1-
score > 0.90) required for real-world disaster triage.

Table 4
Hazard Category Taxonomy

```
Category Description
Flooding
```
```
Monsoon-induced
inundation, flash floods,
urban flooding
Wildfire
```
```
Forest and grass fires
triggered by extreme heat
or El Niño-induced dry
spells
Earthquake Tectonic activity and seismic events
Typhoon Tropical cyclones; most frequent disaster type
```

```
Landslide Rainfallfailures - triggered slope
```
```
Volcanic Eruption
```
```
Activity from active
volcanoes (e.g., Taal,
Mayon)
Drought El Niñoscarcity- induced water
Tsunami Earthquakecoastal inundation-triggered
Storm Surge Typhoonflooding - related coastal
```
The hazard taxonomy utilized in this study is grounded in the legal and
operational frameworks of the Philippine government. It primarily originates from
Republic Act 10121, also known as the Philippine Disaster Risk Reduction and
Management (DRRM) Act of 2010, which defines the legal scope of natural and
human-induced hazards in the country.

To ensure contemporary relevance, the specific categories were validated
against the NDRRMC 2023 Accomplishment Report, which provides statistical
data on the most frequent disaster incidents monitored by the council. According to
these records, approximately 80% of Philippine natural disasters fall under the
hydro-meteorological category (such as typhoons and floods), which serve as the
primary focus of the AGAILA classification system. By aligning with official
NDRRMC reporting standards, the AGAILA framework ensures that its Zero-Shot


Classification output remains interoperable with the data requirements of local
disaster response units and national agencies.

**Data Sources**
To ensure the epistemological validity of the incoming data stream,
AGAILA strictly ingests RSS feeds from high-trust Philippine news nodes,
specifically GMA News and Inquirer.net. This selection is empirically guided by
the Reuters Institute Digital News Report, ensuring nationwide spatial coverage
and linguistic diversity (English, Tagalog, and code-switched Taglish).
Selection criteria include:

- Real-time RSS availability
- Coverage across all 18 administrative regions
- Mixed English/Tagalog/code-switched language
    o Credible disaster reporting

**Automated Collection**
RSS feeds are polled asynchronously using Python’s feedparser with FastAPI:

- HTML content is cleaned using BeautifulSoup
- Non-blocking I/O is implemented using asyncio
- Rate limiting ensures API policy compliance


**Content Extraction**
Every RSS entry is converted to:
text_full = title + ". " + description_clean + " " + content_clean
Manual Annotation (Evaluation Dataset)
Two researchers labeled articles for:

- Hazard type
- Hazard vs. non-hazard classification
    To establish a rigorous empirical baseline for evaluating the AI models, a
reserved testing set was manually annotated by two independent domain
researchers. The annotators classified each payload for both binary hazard presence
(Hazard vs. Non-Hazard) and specific hazard type.

To mathematically validate the reliability of this human-annotated ground
truth, the study calculates inter-annotator agreement using Cohen’s Kappa (κ),

# formalized as: 𝐾= 𝑷𝟏𝒐 −− 𝑷𝑷𝒆𝒆 (where 𝑷𝒐 represents the relative observed

agreement among annotators and 𝑷𝒆 represents the hypothetical probability of
chance agreement). The dataset curation protocol mandates a strict agreement
threshold of 𝑘 ≥ 0. 80 (indicating almost perfect agreement) to ensure the training
and testing sets are free from semantic ambiguity before model benchmarking
commences.


**Linguistic Considerations**

- **~65% English**
- **~30% code-switched**
- **~5% Tagalog**
To operationalize multilingual robustness against the code-switched (Taglish)
text prevalent in Philippine citizen reporting, the framework relies on the inherent
cross-lingual semantic transfer capabilities of the primary DeBERTa-v3 and
secondary FLAN-T5 architectures, negating the need for a specialized, legacy
fallback model.

**Architecture Overview**
Layers:

1. Data Ingestion: RSS feeds, citizen reports, PSGC/NAMRIA reference data
2. Core Processing (AI Pipeline):
    ▪ Text preprocessing
    ▪ ZSC hazard classification
    ▪ Geo-NER location extraction
    ▪ PostGIS validation
3. Presentation Layer (Web App):
    ▪ React + Tailwind
    ▪ Leaflet mapping
    ▪ Supabase Realtime updates


```
Zero-Shot Classification (ZSC)
Following the entailment-based paradigm validated by Yudanto et al.
(2024), AGAILA operationalizes zero-shot classification by binding incoming
unstructured text to a predefined hypothesis template (e.g., 'This text describes a
localized incident of {hazard_type}'). By deploying verbalizer engineering (Schick
& Schütze, 2021) rather than relying on abstract classes, the framework aligns
Philippine text streams with the model's pretrained language representations,
extracting the label that yields the highest entailment score.
```
```
Table 5
Model Fallback Hierarchy
```
```
Geospatial Named Entity Recognition (Geo-NER)
Hybrid System Components
```
- FLAN-T5

Priority Model Parameters Purpose
Primary DeBERTa-v3-base-
zeroshot

```
184M Main hazard
classifier
```
Secondary FLAN-T5-large 780 M NLI fallback

Tertiary DistilRoBERTa-
climate

```
82M Climate-specific
```

- Philippines-specific regex patterns
- PSGC Gazetteer for disambiguation
- Nominatim for geocoding

**Seven-Stage Classification Pipeline**
To operationalize the extraction of hazard intelligence from unstructured text,
AGAILA processes incoming data through a strict seven-stage deterministic and
probabilistic pipeline. Let 𝑇 ={𝑡 1 ,𝑡 2 ,...,𝑡𝑛 } represent the continuous set of
incoming unstructured text streams, and 𝐻 = {ℎ 1 ,ℎ 2 ,...,ℎ𝑚 } represent the
predefined set of natural language inference (NLI) hazard hypothesis templates

**Stage 1 & 2: Noise Pre-Filtering and Unrelated Content Exclusion** Before AI
inference is triggered, the system applies heuristic pattern matching to drop
statistically irrelevant text. If an incoming text 𝑡𝑖 triggers a pattern-match count ≥
2 in predefined non-hazard categories (e.g., crime, politics, sports, entertainment,
business, health), the payload is deterministically excluded to conserve
computational overhead.

**Stage 3 & 4: Hazard Keyword and Philippine Relevance Validation** The
pipeline subsequently executes a lightweight scan for active hazard event indicators
and Philippine geospatial triggers. Texts lacking any identifiable Philippine
location entities or localized hazard vocabulary are flagged for a mathematical
penalty during the later calibration stage.


**Stage 5: Zero-Shot NLI Inference (The Softmax Stage)** Payloads surviving the
heuristic filters are routed to the DeBERTa-v3 NLI architecture. The model
generates raw neural logits z for each hypothesis in H. To compute the entailment
probabilities across the defined hazard categories, the framework processes these

logits through a Softmax normalization function: 𝑃(ℎ𝑗|𝑡𝑖)= (^) ∑𝑚𝑘=𝑒𝑧 1 𝑗𝑒𝑧𝑘
To isolate the primary predicted hazard class (ℎ̂𝑖), the system applies the argmax
operator across this distribution: ℎ̂𝑖= arg max ℎ𝑗∈𝑃𝐻^ (ℎ𝑗|𝑡𝑖) This yields the raw
baseline confidence score (𝐶𝑟𝑎𝑤).
**Stage 6: Heuristic Confidence Calibration and Routing** Because zero-shot
models lack inherent geographic awareness, the raw probability is mathematically
calibrated for the Philippine context. The final confidence score is calculated using
the following proprietary adjustment algorithm: _adjusted_score = raw_score +
confidence_boost + (context_score × 0.5) − philippine_penalty_ If the resulting
adjusted_score ≥ 0.70, the report is automatically verified. If 0.30 ≤ score < 0.70, it
is routed to the human-in-the-loop triage queue, structurally mitigating the inherent
bias of Generalized Zero-Shot Learning (GZSL) models toward over-represented
classes.


**Stage 7: Algorithmic Duplicate Detection (Jaccard Similarity)** To prevent
database saturation from overlapping news coverage during major crisis events,
verified reports undergo a 5-Layer Duplicate Detection Pipeline utilizing exact
cryptographic hashing (SHA-256) and fuzzy title matching. The system calculates
the Jaccard similarity coefficient between the incoming tokenized title (𝑇 1 ) and

existing database titles (𝑇 2 ): 𝐽(𝑇 1 ,𝑇 2 )= ||𝑇𝑇^11 ∩∪𝑇𝑇^22 || A resulting coefficient of J ≥ 0.65

triggers automatic deduplication, ensuring that only novel hazard incidents are
passed to the Geo-NER extraction module.

**Full Pipeline Integration**
To ensure absolute methodological transparency and demonstrate the
framework’s real-time routing capabilities, the following section traces a simulated
unstructured text payload through the four mathematical phases of the AGAILA
pipeline. Assume the system ingests the following unverified citizen report:
Payload (𝑡𝑖): "Massive flooding reported in General Trias, Cavite causing heavy
traffic."


**Phase 1: Logit Normalization (The Softmax Stage)** Upon ingestion, the
DeBERTa-v3 architecture (Laurer et al., 2023) tests the payload against predefined
natural language inference (NLI) hypotheses. The model generates raw neural
logits for each hazard category. To convert these unbounded logits into a valid
probability distribution, the framework applies the Softmax function. Assuming
dummy raw logits of 𝑧𝐹𝑙𝑜𝑜𝑑= 2. 1 , 𝑧𝐸𝑎𝑟𝑡ℎ𝑞𝑢𝑎𝑘𝑒= − 0. 8 , 𝑧𝐹𝑖𝑟𝑒= − 1. 5 , the

Softmax normalization calculates the entailment probabilities:

• 𝑃(𝐹𝑙𝑜𝑜𝑑|𝑡𝑖)= (^) 𝑒 2. (^1) +𝑒𝑒−^20 ..^18 +𝑒− 1. 5 ≈ 0. 93

- 𝑃(𝐸𝑎𝑟𝑡ℎ𝑞𝑢𝑎𝑘𝑒|𝑡𝑖) ≈ 0. 05
- 𝑃(𝐹𝑖𝑟𝑒|𝑡𝑖)≈ 0. 02

**Phase 2: Hazard Selection (The Argmax Stage)** To isolate the primary hazard
classification, the system applies the argmax function across the Softmax
distribution.

- ℎ̂𝑖= arg max ℎ𝑗∈𝐶𝐻^ (𝑡𝑖|ℎ𝑗) Because 0.93 is the maximum value, the system
    deterministically selects "Flood" as the primary hazard, establishing a raw
    baseline confidence of 𝐶𝑟𝑎𝑤= 0. 93.

**Phase 3: Heuristic Calibration** Because zero-shot models inherently lack
localized geographic awareness, AGAILA processes the 𝐶𝑟𝑎𝑤 score through a
proprietary confidence adjustment algorithm: _adjusted_score = raw_score +
confidence_boost + (context_score × 0.5) − philippine_penalty._ During spatial
extraction, the Geo-NER module successfully reverse-geocodes "General Trias,


Cavite" to a valid Philippine bounding box, successfully avoiding the −0.15 out-of-
country penalty. Furthermore, the presence of the contextual severity indicator
("massive") triggers a heuristic +0.05 confidence boost.

- 𝐶𝑎𝑑𝑗𝑢𝑠𝑡𝑒𝑑= 0. 93 + 0. 05 +( 0 )− 0. 0 = 0. 98. Because the final adjusted
    confidence (0.98) strictly satisfies the operational threshold (C ≥ 0.70), the
    system bypasses the human-in-the-loop triage queue and flags the payload
    for immediate database insertion.

**Phase 4: Database Saturation Prevention** Before committing the verified
payload to the spatial database, the 5-Layer Duplicate Detection Pipeline evaluates
the tokenized title against existing records within a 48-hour temporal window.
Assume the database currently holds an active record titled "Flooding in General
Trias". The system applies the Jaccard Similarity coefficient between the incoming
title (𝑇 1 ) and the existing title (𝑇 2 )

- 𝑇 1 𝑡𝑜𝑘𝑒𝑛𝑠:{massive, flooding, in, general, trias}(Size: 5)
- 𝑇 2 𝑡𝑜𝑘𝑒𝑛𝑠:{flooding, in, general, trias}(Size: 4)
- Intersection(|𝑇 1 ∩ 𝑇 2 |): 4
- Union(|𝑇 1 ∪ 𝑇 2 |): 5
- 𝐽(𝑇 1 , 𝑇 2 )= 45 = 0. 80

Because the resulting Jaccard coefficient (0.80) exceeds the strict mathematical
deduplication threshold (J ≥ 0.65), AGAILA correctly classifies the incoming


report as a fuzzy duplicate. The system drops the redundant payload, successfully
conserving cloud compute resources and preventing map saturation.

**Performance Metrics**
To quantitatively evaluate the efficacy of both the Zero-Shot Classification
and Geo-NER modules, the framework adopts the standard natural language
processing evaluation metrics defined by Jurafsky and Martin (2026)
**ZSC Metrics:**

𝑨𝒄𝒄𝒖𝒓𝒂𝒄𝒚 = (^) 𝑻𝑷+𝑻𝑷𝑻𝑵++𝑻𝑵𝑭𝑷+𝑭𝑵
𝑷𝒓𝒆𝒄𝒊𝒔𝒊𝒐𝒏 = (^) 𝑻𝑷𝑻𝑷+𝑭𝑷
𝑹𝒆𝒄𝒂𝒍𝒍 = (^) 𝑻𝑷𝑻𝑷+𝑭𝑵
𝑭𝟏 = 𝟐 ∗ (^) 𝑷𝑷𝑹+𝑹
Macro-averaged values are used for multi-class evaluation.
**Geo-NER Metrics**

- Entity Recognition Accuracy (ERA)
- Geocoding Accuracy (GA)
- Hierarchical Resolution Rate (HRR)


**System Performance Metrics**

- Time-to-Action: < 5 minutes
- Throughput: 30 articles / 60 seconds
- Inference:
    o ZSC < 2s
    o Geo-NER < 1s

**Technology Stack
Backend**

- FastAPI
- HuggingFace Transformers
- PostgreSQL + PostGIS
- Supabase (Auth, Storage, Realtime)
- Celery + Redis
- Docker & Docker Compose

**Frontend**

- React + TypeScrip
- TailwindCSS + ShadCN
- Leaflet
- Zustand
- React Query


**Models**

- DeBERTa (primary)
- FLAN-T5 (fallback)
- DistilRoBERTa-climate
- BERT-base-NER

**Sampling Technique**
This study employs a purposive sampling technique to select respondents
who possess direct experience or specialized knowledge of natural hazards in the
Philippines. The target population includes local government disaster officers,
disaster response personnel, environmental scientists, community leaders or
volunteers, and media/news correspondents operating in hazard-prone areas. This
approach ensures that only individuals with relevant expertise and firsthand
involvement are included, thereby enhancing the quality and reliability of the data
collected

Purposive sampling is chosen over random sampling because the research
aims to capture informed perspectives and specialized insights that are critical for
evaluating the AGAILA framework. Random sampling would risk including
individuals without sufficient background, potentially diluting the validity of the
findings. By focusing on qualified respondents, the study can more accurately
assess the system’s effectiveness in real-world hazard detection and reporting
scenarios.


**Selection Criteria for Respondents:**

- Direct involvement in environmental monitoring, disaster response, or
    hazard reporting.
- Familiarity with recent hazard events such as floods, earthquakes,
    landslides, typhoons, and volcanic eruptions.
- Availability and willingness to participate in surveys, interviews, or
    structured data collection activities.
    The anticipated sample size ranges from 30 to 50 respondents, which is
considered sufficient to provide reliable insights while ensuring representation
across different regions and hazard experiences. This range allows for meaningful
analysis and supports methodological rigor.

```
Data Collection Procedures:
Respondents will be invited to participate through official government lists,
professional networks, and community organizations. Data will be collected using
structured survey questionnaires and system evaluation checklists, administered
online or during hands-on testing sessions. Informed consent will be obtained from
all participants, and confidentiality of responses will be strictly maintained in
accordance with ethical research standards.
```
```
Justification and Representation:
```

```
The sample is designed to cover a diverse set of regions and hazard
experiences, minimizing bias and ensuring that findings are generalizable to the
broader context of environmental hazard management in the Philippines. The
selection process and criteria are documented to support reproducibility and
transparency.
```
**Table 4**
Participants of the Study
Respondent
Category

```
Selection
Criteria
```
```
Number of
Respondents
```
```
Roles in
Study
Local
Government
Disaster
Officers
```
```
Directly
involved in
disaster
response and
hazard
monitoring
```
```
8 Provide
expert
validation
and
contextual
input
Community
Leaders /
Volunteers
```
```
Familiarity with
local hazard
events and
community
reporting
```
```
12 ontribute
locallevel
insights and
experiences
```

Environment
al
Scientists /
Researchers

```
Experience in
hazard studies
and
reporting
```
```
6 Assist in data
verification
and
model
validation
```
Media /
News
Corresponde
nts

```
Report on
environmental
hazards through
verified news
sources
```
```
4 Validate
textual
datasets and
provide
updates
```
IT Experts
(Web
Developers /
QA Testers)

```
Experience in
testing systems,
web, and mobile
application
development
```
```
10 Test and
validate
system
functionality,
usability, and
reliability
```
```
Table 4 presents the participants of the study, highlighting their categories,
selection criteria, number of respondents, and roles in the AGAILA framework
evaluation. The study deliberately uses purposive sampling to ensure that
respondents possess the relevant expertise or experience required for meaningful
contributions to both the data validation and system evaluation processes.
```

**Local Government Disaster Officers** were included as key respondents
due to their direct involvement in disaster response and hazard monitoring. Their
insights provide authoritative validation of hazard-related data and contribute
contextual information that improves the accuracy and reliability of the AGAILA
framework.

**Community Leaders and Volunteers** were selected for their familiarity
with local hazard events and community-level reporting. Their participation

ensures that local perspectives and ground-level experiences are incorporated,
which enhances the practical applicability of the system in real-world settings.

**Environmental Scientists and Researchers** offer specialized knowledge
in hazard studies and reporting. They play a crucial role in verifying data quality
and supporting model validation, ensuring that the framework’s outputs are
scientifically sound.

**Media and News Correspondents** contribute by validating textual datasets
obtained from public news sources. Their role ensures that the AGAILA framework
accurately interprets real-world environmental reports, maintaining alignment
with credible information streams.

Finally, **IT Experts, including web developers and QA testers** , provide


technical evaluation of the system. Their expertise is critical for testing
functionality, usability, and reliability of the framework, particularly for web and
mobile application components, ensuring the system performs as intended for end
users.

Overall, the total of **40 respondents** represents a balance between domain
expertise, community insights, and technical evaluation. This diverse group of

participants enables a comprehensive assessment of the AGAILA framework,
combining both data-driven validation and practical system testing to ensure the
robustness and usability of the proposed solution

**Research Locale**
This study will be conducted in the City of General Trias, Cavite, a rapidly
urbanizing city in the CALABARZON Region. Geographically situated in a
lowland area with some elevated barangays, the city is exposed to natural hazards
such as flooding, fire incidents, typhoons, and occasional landslides. Flooding is
particularly significant due to several river systems, including the Rio Grande
(Malabon River), Ylang Ylang River, Cañas River, Halang River, and Pulongan
River, which are prone to overflowing during heavy rainfall and typhoon events.
The city is highly accessible via major roads connecting to Cavite and Metro
Manila, and its growing population, mix of residential and industrial zones, and


active community organizations provide a rich and relevant context for evaluating
the AGAILA-based environmental hazard reporting and classification system.
Data will be collected in coordination with the City Disaster Risk Reduction
and Management Office (CDRRMO), local government units, community
volunteers, media entities, and academic researchers, who will serve as key sources
of information for hazard reporting and validation. The data collection is planned
for November to January 2026, ensuring coverage during periods when natural
hazards are most likely to occur. The combination of hazard exposure, active
institutional coordination, and community engagement makes General Trias an
ideal locale for the study, directly supporting the AGAILA system’s objectives of
accurate reporting, classification, and risk assessment of natural hazards.

**Research Instrument**
This study employs two primary research instruments to comprehensively
evaluate the AGAILA framework: a structured survey questionnaire and a system
evaluation checklist. These tools are designed to capture both qualitative and
quantitative data, enabling a robust assessment of AGAILA’s performance,
usability, and accuracy in detecting and visualizing natural hazards.

**1. Survey Questionnaire**
    The survey questionnaire targets Local Government Disaster Officers,
Community Leaders/Volunteers, Environmental Scientists/Researchers, and
Media/News Correspondents. Its objective is to gather respondents’ perceptions


regarding the accuracy, relevance, and utility of hazard data processed by
AGAILA, as well as their evaluation of the system’s outputs.

- Sections of the Questionnaire:
- Demographic Information: Collects details on the respondent’s role,
affiliated organization, and years of experience in hazard monitoring or
reporting.
- Data Validation Assessment: Utilizes standardized Likert-scale items (1 =
Strongly Disagree to 5 = Strongly Agree) to measure the perceived
correctness, timeliness, and relevance of hazard data generated by
AGAILA.
- Open-Ended Feedback: Provides space for respondents to offer suggestions
and recommendations for improving data accuracy and hazard reporting
processes.
**2. Survey Questionnaire**
The system evaluation checklist is intended for IT experts (such as Web
Developers and QA Testers) and other evaluators engaged in direct system testing.
Its purpose is to systematically assess the AGAILA framework’s functionality,
usability, and reliability, with particular emphasis on its web and mobile application
components.
- **Components of the Checklist:**


1. Functionality Testing: Examines the accuracy of hazard detection,
    classification, and geospatial mapping features.
2. Usability Testing: Assesses the intuitiveness of the user interface, ease of
    navigation, and overall user experience.
3. Performance Testing: Evaluates system response times, stability under varying
    input loads, and the handling of real-time data streams.
4. Reliability Assessment: Documents any errors, bugs, or inconsistencies
    encountered during testing sessions.

**Administration of Instruments**

- The survey questionnaire is distributed online via Google Forms, allowing
    respondents to participate remotely and at their convenience.
- The system evaluation checklist is administered during hands-on testing
    sessions, where IT experts and evaluators interact directly with the
    AGAILA system and record their observations.

**Validity and Reliability**

- Both instruments were subjected to content validation by domain experts in
    natural hazards and IT system testing to ensure clarity, relevance, and
    comprehensiveness.
- A pilot test was conducted with a representative sample to verify the
    comprehensibility, consistency, and appropriateness of the questions.


- The use of standardized Likert scales in the survey enhances the reliability
    and comparability of responses.

**Link to Research Objectives**
The survey questionnaire provides data on the perceived accuracy and
relevance of environmental hazard information, directly addressing research
objectives related to data validation. The system evaluation checklist yields insights

into system performance, usability, and reliability, supporting objectives focused
on assessing AGAILA’s operational effectiveness in real-time hazard detection and
visualization.

**Data Gathering Procedure**
Data for this study will be collected from verified online news sources and
selected respondents, including disaster management experts, community leaders,
and IT specialists. The purpose of data collection is to validate environmental
hazard information and evaluate the operational effectiveness of the AGAILA
framework in real-world scenarios.

**Sources of Data**


- Primary Sources: Survey questionnaires and system evaluation checklists
    administered to selected respondents (experts, officials, community leaders,
    IT specialists).
- Secondary Sources: Real-time hazard reports aggregated from verified
    Philippine news organizations via RSS feeds, and publicly available
    datasets on natural hazards.

**Step-by-Step Data Collection Procedure**

1. **Preparation:**
    - Obtain necessary permissions from relevant authorities and organizations.
    - Prepare survey instruments and system evaluation checklists.
    - Ensure all software tools and the AGAILA system are operational.
2. **Sampling:**
    - Select 35 respondents based on predefined criteria (see sampling table),
       ensuring representation from key stakeholder groups.
3. **Instrument Administration:**
    - Distribute the survey questionnaire online via Google Forms.
    - Conduct hands-on system testing sessions, where respondents use the
       AGAILA system and complete the evaluation checklist.
4. **Data Recording:**
    o Collect all survey responses and system evaluation results.


```
o Record system logs and hazard detection outputs from the AGAILA
platform.
```
5. **Data Verification / Cleaning:**
    - Review collected data for completeness and accuracy.
    - Remove duplicate entries and check for inconsistencies in responses and
       system logs.
       All respondents will provide informed consent prior to participation. Data
collected will be treated as confidential, with no personal identifiers recorded. The
study adheres to data privacy standards and ensures the anonymity of all
participants.

**Tools and Technologies Used**

1. Google Forms for survey administration
2. AGAILA system interface for hands-on testing and system log collection
3. Spreadsheets and secure databases for organizing and storing collected data

**Data Handling and Storage**
All survey responses, system evaluation results, and hazard detection logs
will be stored in encrypted files on a secured server accessible only to the research
team. Data will be regularly backed up and protected against unauthorized access.

**Link to Objectives**


This data gathering procedure directly supports the study’s objectives by
providing validated hazard information and user feedback necessary for assessing
the accuracy, usability, and reliability of the AGAILA framework.

**System Development Process**
The AGAILA framework was developed utilizing an Agile development
methodology, a choice made to effectively manage the complexity inherent in
integrating two distinct AI models: Zero-Shot Classification (ZSC) and Geospatial
Named Entity Recognition (Geo-NER). This iterative approach facilitated
continuous testing, rapid feedback, and seamless integration between the novel
NLP components and the final output interface. The development commenced with
the Architecture Design and Setup phase, which translated the conceptual Input-
Process-Output (IPO) model into a functional technical blueprint. During this time,
researchers defined data structures, established APIs for fetching real-time RSS
feeds, and critically, configured the PostGIS database. This database was set up to
manage high-volume incoming hazard reports and to house the static, authoritative
Geospatial Reference Data (Philippine administrative boundaries) essential for later
validation.

Following the design phase, Component Development and Model Training
began, focusing on the parallel, independent creation of the two core AI
components. The Zero-Shot Classification (ZSC) Model, built upon the pretrained
DeBERTa-v3 architecture, was fine-tuned using the annotated training set to


enhance its semantic understanding of localized Philippine crisis reporting, thereby
optimizing its Recall to minimize missed detections of critical, unseen hazard types.
Simultaneously, the specialized Geo-NER Model (dslim/bert-base-NER) was
trained to accurately identify location entities, with efforts focused on achieving
high Precision in entity extraction to mitigate homonym and ambiguity issues
common in geographical text. Intermediate performance checks were conducted
against the validation set to ensure each model achieved stable functionality before
the core integration step.

The subsequent phase was Integration, Validation, and Geospatial
Mapping, where the intellectual novelty of AGAILA was realized. The two models
were linked sequentially: the classified Hazard Type from the ZSC component was
paired with the extracted Location from the Geo-NER component. A critical
Geospatial Validation routine was implemented, automatically passing raw Geo-
NER output to the PostGIS database to match the extracted location names against
the stored Geospatial Reference Data. Only locations that successfully matched an
official Philippine administrative boundary were assigned validated coordinates.
This strict filtering mechanism ensured geographic accuracy and relevance before
the data was passed to the Mapping Engine Development component, which
utilized front-end GIS Libraries (like Leaflet) to dynamically render the final real-
time, interactive hazard map.


The final stage involved Evaluation and Final Deployment. The complete
AGAILA framework, spanning from raw RSS input to the PWA map output, was
rigorously tested on the reserved, unseen Testing Set. The system's performance
was objectively measured using standard machine learning metrics (Accuracy, F1-
score) and subjectively assessed by domain specialists via the Expert Usability and
Timeliness Questionnaire. These results guided final refinements to optimize
operational speed (Time-to-Action, TtA) and user experience. The system was then
packaged and deployed as a fully functional Progressive Web Application (PWA),
designed for operational continuity and ready for use by disaster management
stakeholders.

**System Architecture
Layered Architecture:**


The diagram illustrates the Layered Architecture of the AGAILA
(Geospatial AI-Driven Assessment) framework, which is structured to ensure a
clear separation


of concerns, scalability, and robust real-time data flow from input to final
visualization. It consists of three main layers: User Core, Frontend, and Backend.

- **User Core Layer**
This layer defines the main actors and their roles, dictating the permissions and
interaction paths within the system.
- Public: Users who access the main interactive map to View the real-time
hazard markers. They can also submit Citizen Reports via the submission
form.
- LGU (Local Government Unit): Responders who receive alerts, track
hazards in their jurisdiction, and may use the system to verify/update hazard
status.
- Validator: Personnel responsible for performing manual review (Verify) of
medium-confidence AI predictions or citizen reports before they are
displayed as verified hazard markers.
- Admin: Users with comprehensive access, typically utilizing the Admin
Dashboard with analytics and capable of Exporting Reports
- **Frontend Layer**
This layer represents the user interface (UI) and user experience (UX),
primarily focused on visualization and input gathering.


```
o Interactive Map: The core output component, displaying real-time hazard
markers that allow users (Public/LGU) to View and filter data.
o Citizen Report Submission Form: A dedicated interface for Public users to
Submit hazard information and location details for community-based early
warning.
o Admin Dashboard: Provides LGU/Admin users with a centralized view for
analytics, queue management, and resource allocation.
o Filtering: Functionality to refine data display based on criteria like type,
region, time, and source.
```
- **Backend Layer**
This layer houses the business logic, data processing, and core AI intelligence
engines. It is accessed via the REST API.
o AI Model: Integrates the core components of the system: the Zero-Shot
Classification (ZSC) model (DeBERTa-v3) and the Geo-NER model
(BERT-based NER), which perform classification and location extraction
on incoming text streams.
o Data Storage: The PostgreSQL/PostGIS database, which stores both the
transactional hazard records and the authoritative Geospatial Reference
Data (Philippine administrative boundaries) crucial for location validation
and spatial queries.


o External Systems: Represents connections to external data sources like RSS
News Feeds (GMA News, Inquirer.net) and other necessary tools like
geocoding services (Nominatim) and security/queueing systems.
o REST API: Serves as the communication gateway between the Frontend
and the Backend, handling all system calls, data retrieval, and report
submission.

```
Use Case Diagram:
```


This Use Case Diagram visually maps the functional scope of the AGAILA
system, defining the interactions between the external users (actors) and the
system's core capabilities. It is critical for demonstrating how the integrated Zero-
Shot Classification (ZSC) and Geo-NER pipeline is utilized by various
stakeholders.

- **Citizen (Public User)**

The Citizen actor represents the general public and engages in basic information
consumption and data contribution.
o View Public Hazard Map: This allows users to see detected and verified
hazards in real time. It includes the ability to Apply Filters (e.g., by type or
region) for specific queries.
o Submit Hazard Report: This is a key function for participatory
crowdsourcing, enabling the public to send text and optional photo evidence
about emerging events. This process includes a mandatory step to Complete
Captcha Verification.
o Track Report Status: Citizens can follow the verification progress of the
reports they submitted.


- **LGU Responder (Local Government Unit Personnel)**

LGU Responders are operational users who require timely, jurisdiction-specific
information to activate disaster response measures.
o View Jurisdiction Hazards: This ensures responders see only the hazards
relevant to their specific administrative area.
o Receive Real-time Notifications: A crucial function that supports the
system's objective of reducing the Time-to-Action (TtA) by providing
immediate alerts.
o Update Hazard Status: Allows responders to reflect current, real-world
conditions of an event, providing an essential feedback loop.
o Export Reports: Provides tools for generating data exports for strategic
planning and after-action review.

- **Validator (Manual Reviewer)**

The Validator ensures data quality and accuracy, acting as the human-in-the-loop
for medium-confidence reports, leveraging DeBERTa-v3’s confidence calibration.

- View Triage Queue: The Validator accesses the queue of low- or medium-
    confidence reports that the AI models could not automatically verify.
- Verify Citizen Report / Reject Report: Core decision-making functions to
    manually confirm or dismiss submissions from the public.


- Validate AI Predictions: This is specifically for reviewing the ZSC/Geo-
    NER outputs that require human expertise before they are published to the
    map.
- View Audit Logs: Allows tracking of all verification decisions for
    accountability and system improvement.
- **Admin (System Manager)**

The Admin is responsible for the overall configuration, maintenance, and oversight
of the AGAILA framework.
o Configure System Settings / Manage RSS Feeds: These functions are vital
for ensuring the continuous ingestion of data from sources like GMA News
and Inquirer.net, and for adapting the system to operational needs.
o Monitor System Health: Ensures that the entire pipeline, including the AI
models and external services, is running smoothly to maintain near real-
time performance.
o Manage Users: Handles the creation and modification of user accounts and
permissions for all LGU and Validator personnel.
o View Admin Dashboard: Provides a comprehensive, high-level view of
system performance, analytics, and operational metrics.

```
C4 Model:
```

Level 1: System Context Diagram


The diagram shows the AGAILA: Philippine Hazard Detection System at
the center and how it connects to its users and all external technologies required for
its operation.

**1. Users (Actors)**

The AGAILA system interacts directly with three primary user roles in the
Philippine hazard management context:

- Citizen: Contributes data to AGAILA, typically through citizen reports.
- LGU Responder: Receives real-time alerts and hazard information from
    AGAILA to aid in decision-making and response.
- Validator: Reviews and verifies data and AI predictions, ensuring the
    accuracy of the information presented on the map.
**2. Immediate External Systems (Data Providers)**

These systems provide the raw data and core intelligence for AGAILA's main
functions:

- RSS Feeds (GMA, Inquirer): The primary source of unstructured textual
    data, providing real-time news articles on hazards for processing.


- Supabase (Database + Authentication): Serves as the persistence layer for
    hazard data and geospatial reference data (using PostGIS). It also manages
    user authentication.
- HuggingFace Models (DeBERTa): Hosts the core Artificial Intelligence
    components:
    o DeBERTa: Used for Zero-Shot Classification (ZSC) to identify the
       hazard type.
    o BERT: Used for Geospatial Named Entity Recognition (Geo-NER) to
       extract location names.
**3. Peripheral External Systems (External Services)**

These are supporting technologies that enable critical non-AI functionalities like
security, location lookup, and real-time processing:

- Cloudflare Turnstile (CAPTCHA): Used for security, primarily to prevent
    spam and abuse in the citizen reporting submission form.
- Nominatim Geocoding (OSM): A service that converts the extracted
    location names (from Geo-NER) into usable latitude and longitude
    coordinates for mapping.
- Redis Message Queue: Likely used as a high-speed broker to manage and
    process the continuous stream of incoming RSS articles and other
    asynchronous tasks in a real-time environment.


Level 2: Container Diagram


This diagram outlines the major runtime environments (containers) that host
the AGAILA framework, detailing the technologies used in the Frontend, Backend,
and AI Processing Pipeline.

- **User Interface and Access**
- User Browser: This represents the client device (e.g., a phone or desktop)
    interacting with the system over HTTPS.
- React PWA (Frontend): This is the core application displayed to the user,
    operating on Port 3000. It is developed using React to be a Progressive Web
    Application (PWA), offering an app-like experience.
- Leaflet Maps: This is the specific library used to render the interactive
    hazard map and geospatial visualization.
- React Query State: Manages the data fetching and synchronization between
    the frontend and backend.
- Real-time WebSocket: Enables the frontend to receive immediate updates
    when a new hazard is detected or verified, ensuring real-time situational
    awareness.
- **Core Application Services**
1. FastAPI (Backend): This is the central server-side container, operating on Port
8000, responsible for handling all requests. It manages:
- API Gateway: Routes all incoming requests.


- RBAC Middleware: Implements Role-Based Access Control to enforce
    permissions for different user types (Admin, Validator, LGU).
- Security Headers: Ensures secure communication.
2. Communication Channels:
- REST API: Used for standard requests like logging in, filtering data,
and submitting reports.
- WebSocket: Used for pushing real-time hazard markers to the map.
- JWT Auth: JSON Web Tokens are used for secure authentication and
user session management.
- **AI and Asynchronous Processing**
- AI/ML Pipeline: This is the dedicated container that runs the
computationally intensive Natural Language Processing (NLP) tasks:
- Classify: Executes the Zero-Shot Classification (ZSC) model
(DeBERTa-v3) to determine the hazard type.
- Geo-NER: Executes the BERT-based model for Geospatial Named
Entity Recognition to extract locations.
- Geocode: Uses Nominatim (an external system) to convert extracted
location names into coordinates.
- Background Worker: This container handles scheduled and resource-
intensive jobs asynchronously:


- Celery Worker: Processes tasks like fetching new RSS feeds or
    performing large report exports in the background, minimizing latency
    on the main API.
- Celery Beat: A scheduler that triggers recurring tasks, such as polling
    the RSS feeds every 5 minutes.
- Redis Port: 6379: This acts as the message broker, facilitating
communication between the FastAPI backend and the Celery Workers for
processing jobs.
- **External Cloud Infrastructure**
- Supabase Cloud: The main persistence layer hosted externally, providing critical
infrastructure services:
- PostgreSQL + PostGIS: The spatial database that stores hazard records
and performs geospatial validation against administrative boundaries.
- Supabase Auth (JWT): The dedicated authentication service.
- Row-Level Security (RLS): Ensures that LGU Responders can only
access data relevant to their jurisdiction.


Level 3: Component Diagram


```
The FastAPI Backend, which serves as the hub of the AGAILA framework,
is logically divided into five major layers: API, Business Logic, AI/ML, Security
& Auth, and Data Access.
```
- **API Layer**

```
This layer handles all incoming network requests, ensuring security and proper
routing.
```
- Core Routes (/classify, /extract): Endpoints used for the core AI functions, such as
    sending text for ZSC and Geo-NER processing.
- Admin Routes (/admin/*): Endpoints for high-level management tasks, like
    configuring RSS feeds or generating system-wide reports.
- Citizen Routes (/citizen/*): Endpoints for public interactions, such as submitting a
    new hazard report or tracking its status.
- CORS Middleware: Ensures the frontend (React PWA) can securely communicate
    with the backend.
- Rate Limiter (Slow API): Protects the system from being overwhelmed by too
    many requests, particularly important for resource-intensive processes like
    geocoding.
- Security Header: Implements best practices for secure HTTP responses.


- **AI/ML Layer**

```
This layer contains the core intellectual contribution of the thesis: the models and
the custom geospatial validation logic.
```
4. Classifier: Hosts the Zero-Shot Classification (ZSC) logic, primarily using
    the DeBERTa models to identify the hazard_type and its confidence score.
5. Geo-NER (Geospatial Named Entity Recognition): Uses the BERT-based
    NER model to identify and extract Location names, which are then
    geocoded to Coordinates.
6. Preprocessing: Cleans and normalizes raw text fetched from RSS feeds,
    preparing it for AI input.
7. PostGIS Validator: This critical component uses the spatial database to:
- Validate coordinates against Philippine bounds.
- Match locations to the Admin Division map (provinces, regions).
- Perform Duplicate check.
- **Business Logic Layer**

```
This orchestrates the flow of data, manages the incoming reports, and generates
operational outputs.
```

- RSS Processor: Manages the automated fetching, parsing, and deduplication of
    incoming textual information from online news sources.
- Report Validator: Contains the Triage Queue and Validation Logic responsible for
    the confidence-based routing mechanism. High-confidence reports are auto-
    verified, while medium-confidence reports are routed here for human review.
- Analytics Engine: Computes statistics, tracks Trend Analysis, and powers the KPI
    Dashboard for LGU and Admin users.
- Report Generator: Creates essential operational documents, including PDF
    Generation and exports in formats like CSV/GeoJSON.
- **Security & Auth Layer**

```
Ensures that only authorized users can perform specific actions.
```
- RBAC Middleware (Role-Based Access Control): Checks the user's role (Citizen,
    LGU, Admin) based on their JWT verification to enforce appropriate Permission
    checks.
- Activity Logger: Maintains an audit trail of system events and user actions for
    accountability and governance.


- **Data Access Layer**

```
Manages all interactions with the core database infrastructure.
```
- Supabase Client: The interface for communicating with the external
    Supabase/PostGIS database.
- RLS Enforcement: Ensures Row-Level Security is properly applied, guaranteeing
    users only retrieve data they are authorized to see.
- Real-time Subscription: This connects to the WebSocket service to push validated
    data to the frontend.

```
Level 4: Code Diagram
```


```
The diagram details the internal mechanics of the AGAILA system's
automated data transformation, from ingestion to the final decision logic,
supporting the goal of near real-time hazard detection.
```
- **Data Ingestion (RSSProcessor Class)**

```
The process begins with the RSSProcessor Class in rss_processor.py, which
handles fetching and cleaning the raw hazard reports.
```
- processor_feed and process_all_feeds: Functions responsible for fetching data
    from the verified news RSS feeds (GMA, Inquirer).
- clean_html and clean_duplicate: Methods for preparing the text by cleaning
    HTML tags and performing text-based deduplication.
- store_rss_item: Saves the pre-processed item into the database queue.
- **Parallel AI Processing**

```
Once an item is ready, the core AI tasks are executed in parallel to minimize the
Time-to-Action (TtA).
```
```
A. Hazard Classification (ClimateNLIClassifier Class)
This class implements the Zero-Shot Classification (ZSC) logic.
```
- active_model: Holds the loaded transformer model, primarily
    DeBERTa/FLAN-T5


- classify and classify_batch: Functions that take the clean text and output
    the predicted hazard_type and its associated confidence_score using a
    semantic relationship approach.

**B. Geospatial Extraction (GeoNER Class)**
This class implements the Geo-NER logic, combining the deep learning model
with custom rule-based validation.

- bert_ner: The function that uses the BERT-based NER model to identify
    location entities (B-LOC, I-LOC) from the text.
- pattern_match: Implements the custom rule-based pattern matching
    against the extensive database of Philippine geographic entities,
    addressing code-switching challenges.
- geocode: Converts the extracted location names into latitude and longitude
    coordinates using the Nominatim Geocoding service.
- validate_philippines and get_region: Functions that use the Philippine
    administrative boundaries to ensure coordinates are correct and to
    automatically assign the hazard to its administrative unit (e.g.,
    region/province).


- **Pipeline Result and Decision Logic**

```
The results from the parallel classification and extraction are merged into the
Pipeline Result object, which contains the complete, structured data record
including the hazard_type, the overall confidence_score, and the geocoded
locations.The final step is the Confidence Check and Decision Logic, which
determines the immediate action for the new hazard record.
o High Confidence ( ≥ 0.7): The record is considered verified, immediately
inserted into the AGAILA.hazards table as verified, and a realtime
notification is triggered to LGU Responders.
o Medium Confidence ( ≥ 0.3 and ≤ 0.7): The record is inserted into the
AGAILA.citizen_reports table as unverified and automatically added to
the triage queue for manual review by a Validator.
o Low Confidence (< 0.3): The record is only logged for analysis and not
acted upon, preventing false alarms and resource misallocation.
Because Generalized Zero-Shot Learning models inherently exhibit a strong
prediction bias towards seen classes (Pourpanah et al., 2022), and to mitigate the
'black box' opacity inherent in deep learning DRM applications (Ghaffarian et al.,
2023), AGAILA systematically routes borderline-confidence predictions (0.3 ≤ C
< 0.7) to a human-in-the-loop triage queue, enforcing domain-expert validation
before deployment.
```

```
Data Analysis
```
(^) The data analysis procedure for the AGAILA framework employs
quantitative statistical analysis to evaluate both the technical efficacy of the core
AI models and the system's operational performance metrics.
**Stage 1: AI Model Performance Evaluation**
To quantitatively validate the zero-shot classification architecture,
performance is benchmarked using a reserved, human-annotated testing set.
AGAILA evaluates the primary model (DeBERTa-v3-base-zeroshot) against
established natural language inference baselines, specifically BART-large-MNLI
and XLM-RoBERTa-XNLI. The framework adopts standard evaluation metrics,
with a mandated operational threshold requiring the primary classifier to achieve
an F1-score > 0.80. The primary metrics computed include:
● Accuracy, measuring overall correctness
● Precision, assessing the rate of false alarms (crucial for minimizing
resource misallocation)
● Recall, assessing the rate of missed detections (essential for
capturing all reported hazards)
● F1-score, providing a balanced measure of performance
(particularly important for handling potentially imbalanced hazard
datasets)


Furthermore, the quantitative analysis includes Algorithmic Fairness
Analysis through statistical hypothesis testing (ANOVA/Kruskal-Wallis)
comparing F1-scores across different linguistic inputs (English vs. Tagalog vs.
Taglish) and geographic regions to detect and quantify potential discriminatory bias
in detection rates. Additionally, Uncertainty Quantification is statistically analyzed
through correlation analysis between the ZSC model's confidence scores and
prediction correctness to contextualize output reliability.

**Stage 2: System Performance Evaluation**
The second stage focuses on the system's operational performance metrics,
measured through automated logging and timestamp analysis. The system's
Timeliness (Time-to-Action, TtA) is quantitatively analyzed using descriptive
statistics (mean, median, standard deviation, percentiles) on the automatically
logged elapsed time between the article publication timestamp (from RSS
metadata) and the hazard marker's database insertion timestamp. The operational
threshold of Median TtA < 5 minutes is used to verify if the system meets "near
real-time" requirements.


## .

```
Ethical Considerations
```
(^) In an IT research or capstone project, ethical considerations play a significant role
in ensuring that the project is conducted responsibly and aligns with professional
and societal standards. Here are key ethical considerations to keep in mind:

**1. Data Privacy and Confidentiality**
    - **Sensitive Information Protection** : Researchers must ensure that any
       personal or sensitive data (e.g., health, financial, or identifiable information)
       is protected and handled with strict confidentiality.
    - **Data Anonymization** : If the research involves user data, it's crucial to
       anonymize it to prevent identification of individuals.
    - **Compliance with Data Protection Laws** : Adherence to laws such as
       GDPR (General Data Protection Regulation) or HIPAA (Health Insurance
       Portability and Accountability Act) is essential when handling sensitive
       data.
     - **Privacy Policy Disclosure** : The system provides a public privacy policy
         explaining what personal data is collected in citizen reports, how it is used,
         and how users can request access, correction, or deletion under applicable
         data protection laws (e.g., RA 10173 in the Philippines).
**2. Informed Consent**
    - **Participants’ Knowledge** : When involving human subjects in your
       research (e.g., surveys, testing), it is important to obtain their informed


```
consent. Participants should be fully aware of what the study involves and
any risks.
```
- **Voluntary Participation** : Participation should be voluntary, without any
    form of coercion or undue influence, and subjects should be allowed to
    withdraw at any time.
**3. Intellectual Property and Plagiarism**
- **Original Work** : Capstone projects should avoid plagiarism, ensuring
proper citation of sources and acknowledgment of previous research.
- **Copyright and Licensing** : Use of third-party software, libraries, or tools
should respect copyright and licensing agreements.
**4. Social Impact and Responsibility**
- **Impact on Society** : The potential societal effects of the project should be
evaluated. Avoid projects that could have negative consequences, such as
violating human rights or enabling harmful practices.
- **Sustainability and Inclusivity** : Consider environmental sustainability and
inclusivity, ensuring that technology developed benefits a broad range of
users without discrimination.
**5. Cybersecurity and Protection from Harm**


- **Ensuring Security** : If the project involves software development, ethical
    consideration must include building secure and resilient systems to protect
    users from cyber threats.
- **Avoiding Harm** : Projects should avoid causing harm to individuals or
    systems, whether through negligence, vulnerabilities, or malicious design.
**6. Bias and Fairness**
- **Algorithmic Bias** : If the project involves algorithms, ensure that they are
fair and unbiased. Biased systems can lead to discriminatory outcomes, so
fairness should be a priority.
- **Transparency** : Be transparent about how data is used and analyzed to
prevent hidden biases from affecting results.
**7. Accountability and Integrity**
- **Accuracy in Reporting** : Researchers should report findings honestly,
without fabricating, falsifying, or misrepresenting data or results.
- **Responsibility for Actions** : Take responsibility for the ethical conduct of
your research, including acknowledging any limitations or weaknesses in
the study.
**8. Dual-Use Technology**


- **Potential for Misuse** : Consider if the technology or research developed
    could be used for both beneficial and harmful purposes, and take steps to
    mitigate any risks of misuse.
**9. Collaboration Ethics**
- **Equal Credit** : In collaborative projects, ensure that all contributors receive
appropriate credit, and no one’s contributions are overlooked.
- **Conflict of Interest** : Disclose any conflicts of interest, such as personal,
financial, or professional connections that could affect the research
outcomes.

These ethical considerations ensure that an IT capstone project or research is
conducted responsibly, safeguarding the interests of individuals, society, and the
broader tech community.

---

## LITERATURE CITED

Ghaffarian, S., Taghikhah, F. R., & Maier, H. R. (2023). Explainable artificial
intelligence in disaster risk management: Achievements and prospective
futures. _International Journal of Disaster Risk Reduction_ , 98, 104123.
https://doi.org/10.1016/j.ijdrr.2023.104123

United Nations Economic and Social Commission for Asia and the Pacific. (2024).
Harnessing digital technologies for disaster risk reduction in Asia and the
Pacific. Retrieved from https://www.unescap.org/our-work/ict-disaster-
risk-reduction

United Nations Office for Disaster Risk Reduction. (2023). Global Assessment
Report on Disaster Risk Reduction 2023: Mapping Resilience for the
Sustainable Development Goals. Retrieved from
https://www.undrr.org/gar/gar2023-special-report


McDaniel, E. (2024). Zero-shot classification of crisis tweets using instruction-
finetuned large language models. arXiv. https://arxiv.org/abs/2410.00182

Rondinelli, A., Bongiovanni, L., & Basile, V. (2022). Zero-shot topic labeling for
hazard classification. Information, 13(10), 444.
https://www.mdpi.com/2078-2489/13/10/444

Jurafsky, D., & Martin, J. H. (2024). Speech and Language Processing (4th ed.,
draft). https://web.stanford.edu/~jurafsky/slp3/

Havas, C., & Resch, B. (2021). Portability of semantic and spatial–temporal
machine learning methods to analyse social media for near-real-time
disaster monitoring. Natural Hazards. Advance online publication.
https://link.springer.com/article/10.1007/s11069- 021 - 04808 - 4

UP NOAH Center. (n.d.). Nationwide Operational Assessment of Hazards
(NOAH). University of the Philippines. https://noah.up.edu.ph/

National Disaster Risk Reduction and Management Council (NDRRMC).
(2023). _2023 Accomplishment Report_. Department of National Defense,
Republic of the Philippines. https://rbmes-
api.ndrrmc.gov.ph/download/NDRRMC-AR-2023.pdf


National Mapping and Resource Information Authority (NAMRIA).
(2024). _Philippine administrative boundaries
dataset_. https://www.namria.gov.ph

Fan, W., & Liu, X. (2021). Zero-shot text classification with self-
training. _Proceedings of the 59th Annual Meeting of the Association for
Computational Linguistics (ACL 2021)_ , 4288-4299. Proceedings of the
59th Annual Meeting of the Association for Computational Linguistics and
the 11th International Joint Conference on Natural Language Processing
(Volume 1: Long Papers) - ACL Anthology

He, P., Liu, X., Gao, J., & Chen, W. (2021). DeBERTa: Decoding-enhanced BERT
with disentangled attention. In ICLR 2021.
https://arxiv.org/abs/2006.03654

Schick, T., & Schütze, H. (2021). Exploiting cloze questions for few-shot text
classification and natural language inference. EACL.
https://arxiv.org/abs/2001.07676

Chung, H. W., Hou, L., Longpre, S., Zoph, B., Tay, Y., et al. (2022). Scaling
instruction-finetuned language models (FLAN). arXiv:2210.11416.
https://arxiv.org/abs/2210.11416


Yudanto, F., Sari, Y., & Zaki, M. Z. A. C. (2024). Climate-NLI: A Model for
Natural Language Inference on Climate Change Text. Proceedings of the
38th Pacific Asia Conference on Language, Information and Computation
(PACLIC 38).https://aclanthology.org/2024.paclic-1.57/

Hong, J., Park, S., Kim, H., Son, H., & Kang, P. (202 3 ). Empowering sentence
encoders with prompting and label retrieval for zero-shot text classification.
arXiv preprint arXiv:2212.10391.https://arxiv.org/abs/2212.10391

Pourpanah, F., Abdar, M., Luo, Y., Zhou, X., Wang, R., Lim, C. P., Wang, X. Z.,
& Wu, Q. M. J. (2022). A Review of Generalized Zero-Shot Learning
Methods. IEEE Transactions on Pattern Analysis and Machine Intelligence,
45(4), 4051-4070. https://doi.org/10.1109/TPAMI.2022.3191696

Mai, G., Janowicz, K., Hu, Y., Gao, S., Yan, B., Zhu, R., ... & Lao, N. (2022). A
review of location encoding for GeoAI: methods and applications.
_International Journal of Geographical Information Science_ , 36(6), 1139-
1173.
https://www.tandfonline.com/doi/full/10.1080/13658816.2021.2004602

Laurer, M., van Atteveldt, W., Casas, A., & Welbers, K. (2023). Building Efficient
Universal Classifiers with Natural Language Inference. arXiv preprint
arXiv:2312.17543.


(^)
(^)
(^)
(^)
(^)
(^)
(^)

## APPENDICES


(^)
(^)
(^)
(^)
**APPENDIX A
Certificate of Statistical Analysis**
(^)


```
sign
```
```
sign
```
(^)
(^)

## CERTIFICATE OF STATISTICAL ANALYSIS

Title of work: Characterization of Blast Resistance Gene in Rice ( _Oryza sativa_ )

This is to certify that this thesis for the degree Bachelor of Science in Biology has
has been statistically analyzed by the undersigned statistician with respect to
appropriate measurement tools and techniques.

```
_______________________
JOY GOMEZ
Statistician
_______________________
Date Signed
```
```
Noted by:
```

```
TERESA R. CRUZ, PhD
Research Adviser
_______________________
Date Signed
```
(^)
(^)

## APPENDIX B

**Certificate of English Editing**


```
sign
```
## CERTIFICATE OF ENGLISH EDITING

Title of work: Characterization of Blast Resistance Gene in Rice ( _Oryza sativa_ )

This is to certify that this thesis for the degree Bachelor of Science in Biology has
been reviewed and found it thorough and acceptable with respect to form, styles
and standards adhered by the institution by the undersigned English Critic.

## _______________________

## JOY GOMEZ

```
English Critic
_______________________
Date Signed
```

```
sign
```
```
Noted by:
TERESA R. CRUZ, PhD
Research Adviser
_______________________
Date Signed
```
(^)
(^)

## APPENDIX C

**Certificate of Technical Editing**


```
sign
```
## CERTIFICATE OF TECHNICAL EDITING

Title of work: Characterization of Blast Resistance Gene in Rice ( _Oryza sativa_ )

This is to certify that this thesis for the degree Bachelor of Science in Biology has
has been reviewed and found it thorough and acceptable with respect to form, styles
and standards adhered by the institution by the undersigned Technical Editor.

## _______________________

## JOY GOMEZ

```
Technical Critic
_______________________
Date Signed
```
(^)


Noted _sign_ by:
**TERESA R. CRUZ, PhD**
Research Adviser
**_______________________**
Date Signed
