**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

****

****

****

****

**GAIA - Geospatial AI-Driven Assessment: An AI-Driven Framework** **Integrating Zero-Shot Classification and Geo-NER for Real-Time** **Environmental Hazard Detection. **

****

****

****

****



An Undergraduate Thesis 

Submitted to the Faculty of the 

College of Information Technology and Computer Science Lyceum of the Philippines University-Cavite 





In Partial Fulfillment 

of the Requirements for the Degree of 

Bachelor of Science in Computer Science 

with specialization in Software Engineering 





****

**IAN M. LUMANOG **

**ALEXIS JOHN L. RELLON **

**AARON JOSHUA B. ROXAS **

**BEO ALVARO E. SALGUERO **

****

****

****

****

August 2026 

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****



****

**TABLE OF CONTENTS **

****

****

**PAGE **

Title Page 

i 

Access Leaf 

ii 

Acceptance Sheet 

iii 

Author Permission Statement 

iv 

Certificate of Originality 

v 

Acknowledgment 

vi 

Table of Contents 

vii 

List of Tables 

viii 

List of Figures 

ix 

List of Appendices 

x 

Abstract 

xi 





**CHAPTER I: INTRODUCTION** 

Background and Rationale of the Study 

1 

Objectives of the Study 

2 

Significance of the Study 

4 

Scope and Limitation 

5 





**CHAPTER II: REVIEW OF RELATED LITERATURE** 

Literature Review 

6 

Conceptual Framework 

15 

Definition of Terms 

20 





**CHAPTER III: METHODOLOGY** 

Research Design 

23 

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 





Sampling Technique 

24 

Participants of the Study 

25 

Research Locale 

25 

Research Instrument 

26 

Data Gathering Procedure 

26 

System Development Process 

27 

System Architecture 

27 

Data Analysis 

28 

Ethical Considerations 

28 





**LITERATURE CITED **

51 





**APPENDICES **

72 

****





****

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

****

**LIST OF TABLES **

****

****

**TABLE **

****

**PAGE **

****

1 

Non quis animi et saepe sunt et veritatis 22 

officia qui illo commodi at ducimus dolores. 

Ab libero eaque qui distinctio facilis aut autem enim et 



2 

Est iure excepturi et recusandae voluptatem 28 

est quia quidem est perferendis dolores ut porro voluptates sed be 



3 

Non quis animi et saepe sunt et veritatis 41 

officia qui illo commodi at ducimus dolores. 

Ab libero eaque qui distinctio facilis aut autem enim et 



****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

****

**LIST OF FIGURES **

****

****

**TABLE **

****

**PAGE **

****

1 

Ab libero eaque qui distinctio facilis aut 22 

autem enim et 



2 

Est iure excepturi et recusandae voluptatem 28 

est quia quidem est perferendis dolores ut porro voluptates sed be 



3 

Ab libero eaque qui distinctio facilis aut 41 

autem enim et 



****



****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

****

**LIST OF APPENDICES **

****

****

**TABLE **

****

**PAGE **

****

A 

Letter of Request 

81 



B 

Survey Questionnaire 

82 



C 

Informed Consent Form 

83 



****



****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

****

**LIST OF ABBREVIATIONS **

****

****

DNA 

Deoxyribonucleic acid 



PCR 

Polymerase chain reaction 

RNA 

Ribonucleic acid 





****



****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****

****



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

****

**CHAPTER I **

****

**INTRODUCTION **

****

**Background and Rationale of the Study **

Awareness of environmental hazards is fundamental to human survival and decision-making. Just as sight allows humans to perceive danger in their surroundings, data awareness enables societies to respond to emerging threats in their environment. In the digital era, much of this awareness comes from textual information, news reports, updates, and situational bulletins that narrate real-world events as they unfold. 



Fig. 1.1 Bridging the Gap from Fragmented Text to Actionable Geospatial Intelligence 



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



However, this vast information landscape is often unstructured and fragmented across various sources. Transforming it into a coherent understanding of what, where, and when a hazard occurs remains a challenge \(Ghaffarian, 2023\). 

To bridge this gap, artificial intelligence now extends human awareness into the digital domain, enabling systems to automatically interpret textual data and translate it into actionable geospatial insights \(Fan & Liu, 2021; Imran et al., 2015\).. 



This vision forms the foundation of GAIA, an AI-driven framework that integrates Zero-Shot Classification \(ZSC\) and Geospatial Named Entity Recognition \(Geo-NER\) to automatically detect and locate environmental hazards from online information streams. Like how human cognition connects observation to meaning \(Long, 2017\), GAIA aims to give machines the capacity to 

“understand” events as they are reported, bringing society one step closer to real-time geospatial intelligence. 



**Objectives of the Study **

To design, develop, and evaluate GAIA, an AI-driven framework that leverages ZSC and Geo-NER to automatically detect and locate environmental hazards from online information streams in near real-time. 





COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



1. To collect and preprocess textual information from online sources for environmental hazard reporting. 

2. To implement a ZSC model capable of detecting previously unseen hazard categories in textual data. 

3. To integrate Geo-NER for automatic extraction of location-specific information from hazard reports. 

4. To develop a system that visualizes detected hazards on a geospatial map for decision-making purposes. 

5. To evaluate the performance of GAIA in terms of accuracy, timeliness, and usability for real-world environmental hazard detection. 



****

**Significance of the Study **



Zero-Shot Learning \(ZSL\) is a powerful approach in artificial intelligence that enables models to recognize and classify categories they have never seen during training. For example, a ZSL model trained to identify “floods” 

and “earthquakes” could still correctly detect “landslides” by understanding the semantic meaning of the new label from textual descriptions. This ability mimics COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



human reasoning, where prior knowledge allows people to infer and categorize novel events without direct experience \(Long, 2017\). By applying ZSL, machines can automatically detect previously unseen environmental hazards, which is crucial in a dynamic and unpredictable natural environment where new threats may emerge suddenly. 



Fig. 1.2 ZSC Analogy in Hazard Detection 

GAIA leverages this capability to analyze textual information from online sources in near real-time, detecting hazards without requiring labeled examples for every possible category. Combined with Geo-NER, the system can pinpoint the locations of reported hazards, transforming fragmented and unstructured textual data into structured geospatial insights. This integration not only enhances situational awareness but also supports faster and more informed COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



decision-making for disaster management agencies, local government units, and emergency responders, improving resource allocation and risk mitigation. 



Academically, this study demonstrates the novel application of Zero-Shot Classification to textual hazard detection, expanding its utility beyond traditional domains such as image recognition or general natural language processing. 

Technologically, GAIA illustrates how AI can extend human awareness into the digital domain, automatically converting scattered reports into actionable visual maps. This framework paves the way for real-time hazard monitoring, predictive analysis, and proactive disaster management strategies, providing a solution that is practical, innovative, and academically relevant. 

****



**Scope and Limitation **



The scope of this study focuses on the detection and geolocation of environmental hazards using textual information streams. GAIA is designed to process online reports, news articles, and RSS feeds to automatically identify hazards and their corresponding locations. The system integrates ZSC to recognize hazard types that may not have been included in its training data, allowing it to detect new or emerging threats. Additionally, Geo-NER enables the extraction of precise location information from unstructured text, facilitating the COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



visualization of hazards on a map. This study emphasizes the real-time processing of information to provide timely insights that can support disaster management agencies, local government units, and emergency responders. 



The system is limited in several aspects. Firstly, it relies solely on textual data from online sources, which may not capture hazards in areas with limited reporting or internet coverage. As such, GAIA may miss events that are not documented online or reported in real-time. Secondly, the accuracy of hazard detection is influenced by the quality and clarity of the source text; ambiguous or poorly structured reports can reduce detection precision. Thirdly, while ZSL 

allows the system to identify previously unseen hazards, environmental hazards outside the context of the Philippines, for example, hailstorms reported in other countries, will not be classified, which may affect detection comprehensiveness. 

Lastly, GAIA does not include predictive modeling of hazards or integration with sensor networks, and its scope is limited to detecting and mapping reported events rather than forecasting future occurrences. 

****

****

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

**CHAPTER II **

****

**REVIEW OF RELATED LITERATURE** 

****

**Emergency and Disaster Reporting Systems **

Emergency and disaster reporting systems have evolved significantly over the past decades, transitioning from manual and reactive methods to more integrated, technology-driven platforms. Traditionally, emergency reporting relied on telephone hotlines and SMS-based systems that allowed citizens and local authorities to communicate incidents directly to emergency management offices \(ITU, 2019\). While these systems were essential in establishing communication lines during crises, they often suffered from limitations such as delayed response times, network congestion, and the lack of geospatial accuracy. 



With the growing role of Information and Communication Technology \(ICT\), many countries, including the Philippines, have begun adopting more advanced reporting platforms that utilize mobile applications, cloud-based systems, and geospatial analytics to enhance disaster management operations \(UN 

ESCAP, 2024\). These digital systems enable faster information exchange, facilitate data integration across agencies, and improve the coordination of emergency response activities. The introduction of automated data pipelines and real-time dashboards has further strengthened situational awareness, allowing responders to make informed decisions during disasters \(UNDRR, 2023\). 

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



However, despite these technological advancements, challenges persist in ensuring the timeliness, reliability, and accessibility of emergency data. Many reporting platforms still rely on structured inputs and pre-defined templates, limiting their ability to process unstructured or spontaneous reports from diverse information sources. Furthermore, developing countries face additional barriers such as limited ICT infrastructure, inconsistent internet connectivity, and gaps in interoperability among government systems \(UN ESCAP, 2024\). These challenges highlight the ongoing need for intelligent, adaptive systems that can process heterogeneous data sources and support rapid decision-making during emergencies. 



**Role of ICT in Disaster Risk Reduction and Management** Information and Communication Technology \(ICT\) plays a crucial role in strengthening disaster risk reduction and management \(DRRM\) by enhancing the collection, processing, and dissemination of critical information during all phases of a disaster, from preparedness to recovery. Modern ICT tools, such as remote sensing, Geographic Information Systems \(GIS\), cloud computing, and artificial intelligence, have transformed how disaster data is gathered and analyzed, enabling faster and more informed decision-making \(ITU, 2019\). These technologies facilitate real-time data sharing across agencies, ensuring that COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



emergency response teams, local governments, and national authorities operate with a unified and updated situational picture. 



In the Philippines, ICT has been at the core of national disaster management efforts, particularly through initiatives led by the National Disaster Risk Reduction and Management Council \(NDRRMC\). Systems such as Project NOAH and GeoRiskPH have demonstrated how integrating ICT with hazard modeling and geospatial analytics can improve forecasting accuracy and risk communication. These platforms not only collect environmental data from satellites and sensors but also visualize potential hazard zones, allowing communities to take preventive actions before disasters strike. 



Moreover, ICT enhances coordination and transparency in post-disaster response by supporting digital communication, resource tracking, and information dissemination to affected communities \(UN ESCAP, 2024\). 



****

**AI Applications in Disaster Management** 

Artificial intelligence \(AI\) has become an essential tool in disaster management, enhancing the ability of authorities to predict, monitor, and respond to crises efficiently. By automating the analysis of large volumes of heterogeneous data, AI helps reduce response times, improve situational COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



awareness, and optimize resource allocation. Techniques such as machine learning and natural language processing \(NLP\) are particularly effective for analyzing textual and multimedia data from multiple sources, including news reports, situational bulletins, and official hazard updates \(Fan & Liu, 2021; Imran et al., 2015\). 



One promising approach within AI is Zero-Shot Classification \(ZSC\), which allows systems to identify categories or hazards that were not explicitly included in the training data. Unlike traditional supervised learning, ZSC 

leverages semantic representations, knowledge graphs, or attribute-based embeddings to infer labels for unseen classes, mimicking the human ability to generalize from prior knowledge to novel situations \(Long, 2017\). In disaster management, this capability is critical because new types of hazards or variations in reports can emerge suddenly, and labeled datasets for every possible scenario are often unavailable. 



Another key AI application is Geospatial Named Entity Recognition \(Geo-NER\), which extracts location-specific information from unstructured text and converts it into structured geospatial data. This enables the creation of dynamic hazard maps and dashboards that provide real-time situational awareness for responders and decision-makers \(Imran et al., 2015\). 



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



By combining ZSC with Geo-NER, systems can automatically interpret textual information and identify both the type of hazard and its geographic location, bridging the gap between raw reports and actionable intelligence. 



AI-driven prioritization and risk assessment frameworks further enhance emergency response by ranking incidents based on urgency, severity, or potential impact, ensuring that critical resources are deployed effectively \(Fan & Liu, 2021\). Integrating these technologies into a unified system allows disaster management agencies to move from reactive to proactive operations, ultimately reducing response times, mitigating losses, and improving community resilience. 



**Zero-Shot Text Classification **

Zero-Shot Classification \(ZSC\) is a machine learning technique that enables models to classify text into categories without having seen labeled examples of those categories during training. This capability is particularly valuable in disaster management, where new types of incidents or hazards can emerge unexpectedly, and labeled datasets may be scarce or nonexistent. ZSC 

leverages semantic representations, such as embeddings from pre-trained language models, to infer the appropriate category for unseen text based on descriptive labels or natural language prompts \(Long, 2017; Fan & Liu, 2021\). 





COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



The theoretical foundation of zero-shot learning rests on the ability to transfer knowledge from seen classes to unseen classes through intermediate semantic representations. As demonstrated by Xian et al. \(2017\) in their comprehensive evaluation of zero-shot learning approaches, the effectiveness of ZSC critically depends on the quality of semantic embeddings and the alignment between visual or textual features and class descriptions. Their work established benchmark evaluation protocols that distinguish between classical zero-shot learning \(where test classes are completely disjoint from training classes\) and generalized zero-shot learning \(where both seen and unseen classes may appear during inference\), a distinction highly relevant to disaster management, where systems must recognize both known hazard types and novel incident categories. 



In the context of disaster management, ZSC allows for the automatic classification of unstructured textual data, such as social media posts, news articles, or emergency reports, into predefined hazard categories. This facilitates the rapid identification and prioritization of emerging incidents, enabling timely and coordinated responses. For instance, a ZSC model can classify a tweet about a sudden flood in a previously unaffected area, even if the model has not been explicitly trained on flood-related data. The generalized zero-shot learning paradigm described by Xian et al. \(2017\) is particularly applicable here: GAIA's ZSC implementation must handle both familiar hazard types encountered during COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



model pre-training \(typhoons, earthquakes\) and potentially novel or rare events \(toxic spills, dam failures\) that may not have been explicitly included in the training corpus. 



Recent advancements in ZSC have demonstrated its effectiveness in various domains, including crisis informatics and emergency response. Studies have shown that ZSC models, particularly those fine-tuned on domain-specific data, can achieve high accuracy in classifying crisis-related information \(McDaniel, 2024\). The transition from attribute-based zero-shot learning \(where classes are described by predefined attributes\) to text-based zero-shot classification \(where natural language descriptions serve as class definitions\) has proven especially powerful for NLP tasks. This aligns with Xian et al.'s \(2017\) findings that the choice of semantic representation significantly impacts zero-shot learning performance, in GAIA's case, using natural language hazard descriptions \("flooding", "typhoon"\) as class labels rather than hand-crafted attribute vectors enables the model to leverage rich semantic knowledge encoded in pre-trained language models. 



Additionally, the integration of ZSC with other AI techniques, such as Named Entity Recognition \(NER\) and geospatial analysis, enhances its utility in disaster management by providing both the type and location of hazards COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



\(Rondinelli, 2022\). This multi-modal integration addresses one of the key challenges identified by Xian et al. \(2017\): the "semantic gap" between low-level features \(raw text\) and high-level semantic concepts \(hazard categories\). By combining ZSC for hazard type identification with Geo-NER for spatial grounding, GAIA creates a more robust representation that bridges textual descriptions and real-world geographic contexts. 



**Hazard Category Taxonomy **

****

The GAIA system classifies disaster-related text into nine Philippine-relevant hazard categories. The operational hazard taxonomy comprises: 

● Flooding - Monsoon-induced inundation, flash floods, urban flooding 

● Fire - Residential, commercial, and industrial fires 

● Earthquake - Tectonic activity, seismic events \(Philippines is located on the Pacific Ring of Fire\) 

● Typhoon - Tropical cyclones, the most frequent disaster type \(20\+ 

annually\) 

● Landslide - Rainfall-triggered slope failures, particularly in mountainous regions 

● Volcanic Eruption - Activity from 23 active volcanoes \(Taal, Mayon, Kanlaon, etc.\) 



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



● Drought - El Niño-induced water scarcity, agricultural impacts 

● Tsunami - Earthquake-triggered coastal inundation 

● Storm Surge - Typhoon-related coastal flooding, elevated sea levels This taxonomy reflects the actual disaster risk profile of the Philippines as documented by NDRRMC hazard maps and PAGASA climate data. 



**Model Selection and Comparative Analysis **

The selection of an appropriate ZSC model is critical for achieving reliable disaster detection performance. To ensure optimal performance within the GAIA framework, we conducted a comprehensive evaluation of four prominent zero-shot classification models: DeBERTa-v3-base-zeroshot, BART-large-mnli, ClimateBERT, and XLM-RoBERTa-large-xnli. These models were evaluated based on multiple criteria including accuracy, inference speed, resource requirements, and suitability for Philippine disaster contexts. 



**Evaluation Methodology **

The evaluation employed a dual-dataset strategy to address the complementary needs of controlled model comparison and real-world validation: COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



**Dataset 1: Synthetic Balanced Dataset \(N=900\)** Due to limited manually labeled Philippine disaster data and severe class imbalance in real-world news coverage, we generated a synthetic balanced dataset of 900 samples \(100 samples per category across all 9 hazard types\) using template-based generation with Philippine-specific context. This approach follows established NLP research practices \(Bowman et al., 2015; Anaby-Tavor et al., 2020\) for creating evaluation datasets when real-world labeled data are scarce. 



The generation method employed 270\+ unique templates incorporating authentic Philippine locations \(150\+ cities/provinces across all 18 administrative regions\), PAGASA typhoon nomenclature, PHIVOLCS volcanic/seismic terminology, and realistic casualty ranges. Linguistic diversity was ensured through approximately 30% English \(formal news style\), 35% Tagalog \(local news\), and 35% Taglish \(code-switched text common in Philippine media and citizen reports\). Geographic stratification provided proportional representation across NCR, CAR, Regions I-XIII, and BARMM, while contextual realism incorporated actual Filipino news patterns, damage estimates in Philippine pesos, and local measurement units. 



This dataset enables fair, apples-to-apples model comparison without class imbalance confounds. Following Xian et al.'s \(2017\) recommendation for COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



comprehensive evaluation protocols, the balanced dataset includes both high-frequency classes \(flooding, typhoons—analogous to "seen" classes in traditional zero-shot learning\) and low-frequency classes \(tsunami, volcanic eruption—analogous to "unseen" classes\), enabling assessment of generalization capability across the full spectrum of Philippine hazards. 



**Dataset 2: Real-World RSS Feed Dataset \(N=177\)** To validate model generalization to actual news text patterns, we collected 177 news articles from verified Philippine RSS feeds \(GMA News, Rappler, Inquirer\) representing real-world disaster coverage over a 3-month observation period \(August–November 2025\). 



This dataset exhibits natural class imbalance reflecting actual Philippine disaster frequency \(volcanic eruptions dominate the sample due to Kanlaon and Taal activity during the collection period, followed by earthquakes, fires, and flooding\). Linguistic variation includes a mix of English formal journalism, code-switched English-Tagalog, and colloquial expressions. The dataset contains uncontrolled diversity in article length \(headlines to full reports\), writing style \(breaking news vs. situational updates\), and semantic complexity. Manual annotation ensured human-labeled ground truth for each article, with hazard types verified by two independent annotators. 



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



This dataset serves as the external validation set to assess whether models trained/evaluated on synthetic data generalize to actual operational text encountered in RSS processing. This addresses the domain shift challenge discussed by Xian et al. \(2017\), where models must generalize across different data distributions—in this case, from template-based synthetic text to natural news prose. 

****

**Comparative Results** 

Table 2.1 presents the performance comparison of the four evaluated models. DeBERTa-v3-base-zeroshot emerged as the top-performing model with an F1-score of 0.89, accuracy of 91.2%, and ROC-AUC of 0.94. The model demonstrated consistent performance across all hazard categories, with particularly strong results in typhoon detection \(F1: 0.93\) and flooding \(F1: 0.91\). 

Critically, DeBERTa-v3 exhibited excellent confidence calibration, meaning its prediction confidence scores accurately reflected actual classification accuracy, a crucial property for automated decision-making in disaster response COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 





**Model **

**Parame**

**F1-Scor Accurac ROC-A Inferenc**

**Model **

**Memor**

**ters **

**e **

**y **

**UC **

**e Speed **

**Size **

**y \(GPU\) **

**\(GPU\) **

DeBERTa

184M 

0.89 

91.2% 

0.94 

150ms 

730 MB 

2.5 GB 

-v3-base-z

eroshot 

BART-lar

407M 

0.85 

87.5% 

0.91 

300ms 

1.6 GB 

4.5 GB 

ge-mnli 

ClimateB

82M 

0.62 

64.3% 

0.72 

80ms 

330 MB 

1.2 GB 

ERT 

XLM-Ro

561M 

0.82 

84.1% 

0.88 

450ms 

2.2 GB 

6.0 GB 

BERTa-lar

ge-xnli 

Table 2.1 Zero-Shot Classification Model Performance Comparison BART-large-mnli, a widely-used industry-standard model, achieved an F1-score of 0.85 with 87.5% accuracy. While its performance was strong, it required significantly more computational resources \(4.5 GB GPU memory\) and exhibited slower inference times \(300ms per sequence\) compared to DeBERTa-v3. However, its proven reliability and extensive documentation make it a suitable fallback option. 



ClimateBERT, despite being the smallest and fastest model \(82M 

parameters, 80ms inference\), demonstrated poor performance on disaster COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



detection tasks with an F1-score of only 0.62. Analysis revealed that this model, trained primarily on climate science literature focusing on emissions and temperature data, lacks the semantic knowledge necessary for identifying acute disaster events. It frequently confused climate change discussions with actual hazard occurrences, resulting in high false positive rates. This finding underscores the importance of training data alignment with the target domain, climate science text differs fundamentally from disaster event descriptions. 



XLM-RoBERTa-large-xnli achieved an F1-score of 0.82 and demonstrated superior multilingual capabilities, performing exceptionally well on Filipino and code-switched text \(the linguistic context common in Philippine citizen reports\). 

However, its large size \(561M parameters, 2.2 GB\) and slow inference speed \(450ms\) made it less suitable for real-time RSS processing where rapid classification is essential. Nonetheless, its multilingual strength positions it as a valuable component for future system enhancements focused on processing citizen reports in local languages. 



**Language and Context-Specific Performance **

An important consideration for the Philippine context is the handling of code-switched English-Tagalog text, which is prevalent in both news articles and citizen reports. DeBERTa-v3 demonstrated strong performance on code-switched COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



text, correctly classifying 87% of mixed-language samples compared to 91% for pure English. XLM-RoBERTa performed marginally better on code-switched text \(92%\) due to its explicit multilingual training, but the performance difference did not justify its significantly higher computational cost for the primary RSS 

processing pipeline. 



**Resource Requirements and Deployment Considerations** For deployment on cloud infrastructure \(Heroku Standard-2X dyno with 1 

GB RAM\), DeBERTa-v3's moderate resource footprint \(730 MB model size, 2.5 

GB GPU memory\) enables efficient operation while maintaining high accuracy. 

The model's inference speed of 150ms per sequence on GPU \(300ms on CPU\) supports the system's Time-to-Action target of less than 5 minutes from RSS 

article publication to map visualization. In contrast, XLM-RoBERTa's 6 GB 

memory requirement would necessitate more expensive infrastructure. 



**Confidence Calibration and Automated Triage **

A critical factor in model selection was confidence calibration, the alignment between predicted confidence scores and actual classification accuracy. 

Well-calibrated models produce confidence scores that reliably indicate prediction correctness, enabling automated triage decisions. DeBERTa-v3 exhibited excellent calibration: predictions with confidence ≥0.7 had an actual accuracy of COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



94%, while predictions with confidence between 0.3-0.7 had 68% accuracy, and predictions <0.3 had only 31% accuracy. This clear stratification enables the implementation of confidence-based routing: high-confidence predictions \(≥0.7\) are automatically verified and displayed on the map, medium-confidence predictions \(0.3-0.7\) are routed to human validators for manual review, and low-confidence predictions \(<0.3\) are logged for analysis but not acted upon. 



In contrast, ClimateBERT demonstrated poor calibration, often assigning high confidence scores \(>0.8\) to incorrect classifications, which would lead to false positives being automatically verified, a critical failure mode in disaster response systems where false alarms can divert limited resources. 



**Implementation in GAIA **

Within the GAIA framework, ZSC plays a crucial role by enabling the system to automatically detect and classify new hazards from diverse textual sources, thereby improving situational awareness and decision-making during disasters. Based on the comparative evaluation, GAIA employs a hierarchical model fallback strategy to ensure robustness: 

● Primary Model: DeBERTa-v3-base-zeroshot-v1.1-all-33 \(optimal accuracy-efficiency balance\) 





COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



● Secondary Fallback: facebook/bart-large-mnli \(reliable industry standard\) 

● Tertiary Fallback: climatebert/distilroberta-base-climate-detector \(resource-constrained scenarios only\) 

● Multilingual Fallback: joeddav/xlm-roberta-large-xnli \(future enhancement for native language processing\) 



This hierarchical approach ensures system availability even if the primary model fails to load, while optimizing for the best possible performance under normal operating conditions. The confidence-based routing mechanism leverages DeBERTa-v3's well-calibrated confidence scores to achieve automated verification for 72% of incoming reports \(those with confidence ≥0.7\), reducing the manual validation burden on human operators while maintaining a false positive rate below 6%. 



The integration of ZSC with Geo-NER and PostGIS validation creates a comprehensive automated pipeline that processes RSS feeds every 5 minutes, achieving an average Time-to-Action of 3.2 minutes, well below the 5-minute target. This rapid classification capability significantly enhances the system's ability to provide timely situational awareness during rapidly evolving disaster scenarios. 



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****



**Named Entity Recognition \(NER\) and Geo-NER **

Named Entity Recognition \(NER\) is a fundamental natural language processing \(NLP\) technique that identifies and classifies entities within text into predefined categories such as persons, organizations, dates, and locations \(Jurafsky & Martin, 2024\). In the context of disaster management, NER is particularly valuable for extracting critical information from unstructured textual sources such as news articles, emergency bulletins, and social media posts. By automatically detecting mentions of hazards, affected areas, or key actors, NER 

enables systems to convert fragmented textual information into structured data that can support timely decision-making. 



Geospatial Named Entity Recognition \(Geo-NER\) extends traditional NER by specifically focusing on geographic entities and locations mentioned in text \(Gelernter & Mushegian, 2011\). Geo-NER identifies place names, coordinates, and administrative regions, which can then be mapped onto digital platforms such as GIS dashboards for real-time situational awareness. This is crucial in disaster management, as knowing where a hazard occurs is just as important as knowing what has happened. 





COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



**Hybrid Geo-NER Approach for Philippine Context** The GAIA system implements a hybrid Geo-NER approach that combines deep learning-based entity recognition with rule-based pattern matching and geographic validation, specifically optimized for Philippine locations and linguistic characteristics. This multi-stage approach addresses the unique challenges of Philippine disaster reporting, including code-switching between English and Filipino, regional dialects, homonymous place names, and informal location references. 

****

**Stage 1: BERT-based Named Entity Recognition** The first stage employs a fine-tuned BERT-based NER model \(dslim/bert-base-NER\) to identify potential location entities from unstructured text. BERT \(Bidirectional Encoder Representations from Transformers\) leverages contextual word embeddings to understand the semantic meaning of words based on their surrounding context, enabling it to distinguish between different uses of the same word. For example, BERT can differentiate "San Juan" as a city name from its use as a personal name or religious reference based on contextual cues. 



The model identifies entities tagged as B-LOC \(beginning of location\) and I-LOC \(inside location\), which represent geographic entities at various levels of granularity, from specific addresses to broad regional designations. This COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



general-purpose NER model provides broad coverage but may miss Philippine-specific location names or misclassify code-switched text. Analysis of 500 Philippine disaster reports showed that BERT-based NER alone achieved 73% recall for location entities, missing approximately 27% of valid location mentions due to unfamiliarity with Filipino place names and local terminologies. 



**Stage 2: Philippine-Specific Pattern Matching** To address the limitations of general-purpose NER, the second stage applies rule-based pattern matching against a comprehensive database of Philippine geographic entities. This database encompasses 81 provinces, 18 

administrative regions \(including NCR, CAR, and BARMM\), and over 150 major cities and municipalities drawn from official NAMRIA \(National Mapping and Resource Information Authority\) datasets. 



Pattern matching uses regular expressions with boundary detection to identify exact and partial matches of known place names within the text. For instance, the pattern \(Metro Manila|NCR|National Capital Region\) captures various ways of referring to the capital region, while \(Davao City|Dabaw\) accounts for both formal and colloquial references to Davao. This approach proved particularly effective for detecting abbreviated forms \(e.g., "QC" for COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



Quezon City\) and code-switched phrases \(e.g., "baha sa Marikina" meaning 

"flood in Marikina"\). 



The pattern matching stage increased location recall from 73% to 91% on the evaluation dataset, capturing an additional 18% of location mentions that BERT-based NER missed. Importantly, combining both approaches reduced false negatives while maintaining precision, as the pattern matching rules are constrained to known valid Philippine locations. 

****

**Stage 3: Regional Mapping and Administrative Hierarchy** Extracted location entities are mapped to the Philippine administrative hierarchy to determine their corresponding regions, provinces, and municipalities. 

This mapping is essential for jurisdictional routing, ensuring that local government units \(LGUs\) receive alerts for hazards within their areas of responsibility. The system maintains a hierarchical lookup table that associates each location with its parent administrative units. For example, "Makati City" 

maps to "Metro Manila" \(region\) and "NCR" \(administrative division\). 



This hierarchical knowledge enables spatial reasoning beyond simple name matching. When a report mentions "Bicol," the system can infer that it encompasses the provinces of Albay, Camarines Norte, Camarines Sur, COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



Catanduanes, Masbate, and Sorsogon, information critical for determining which LGUs should be notified. Additionally, the hierarchy helps resolve ambiguities: 

"San Juan" could refer to San Juan City in Metro Manila, San Juan municipality in Batangas, or other municipalities with the same name in Abra, Ilocos Sur, La Union, and Southern Leyte. Context clues \(such as co-occurring location mentions or news source geography\) combined with hierarchical reasoning help disambiguate these cases. 

****

**Stage 4: Geocoding and Coordinate Extraction** Identified location names are geocoded to latitude-longitude coordinates using the Nominatim geocoding service, which queries OpenStreetMap data. 

Nominatim provides global coverage and supports queries formatted as 

"\[location\], Philippines" to constrain results within the country. The geocoding process includes several optimizations: 

● Query Construction: Location names are appended with ", Philippines" to improve geographic precision and reduce ambiguity with international locations. 

● Rate Limiting: Nominatim's usage policy limits requests to one per second. The system implements exponential backoff and request queuing to comply with this constraint, ensuring sustainable long-term operation. 



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



● Result Validation: Returned coordinates are validated against Philippine geographic boundaries \(latitude: 4.0°N to 22.0°N; longitude: 116.0°E to 127.0°E\) to filter out erroneous matches. 

This boundary check prevents false positives from similarly named locations in other countries. 

● Caching: Geocoding results are cached in memory to avoid redundant API calls for frequently mentioned locations, significantly improving performance for high-volume processing scenarios. 



Geocoding success rates vary by location type: major cities achieve 97% 

success \(e.g., Manila, Cebu, Davao\), provinces achieve 94% success, while barangays \(villages\) and informal place names achieve 68% success due to incomplete OpenStreetMap coverage in rural areas. For locations that fail geocoding, the system falls back to province-level or region-level coordinates based on the administrative hierarchy mapping. 



**Stage 5: PostGIS Validation and Spatial Reasoning** The final stage employs PostGIS, a spatial database extension for PostgreSQL, to perform geospatial validation and spatial queries. PostGIS 

provides advanced geometric operations that enable the system to verify that COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



extracted coordinates fall within valid Philippine administrative boundaries, calculate distances between locations, and perform proximity-based duplicate detection. 



**Key PostGIS operations include:** 

● Boundary Validation: The ST\_Within\(\) function verifies that coordinates fall within the stored polygon geometries of Philippine provinces and regions. This catches geocoding errors where Nominatim returns coordinates outside the Philippines or in incorrect provinces. 

● Distance Calculation: The ST\_Distance\(\) function calculates great-circle distances between hazard locations, enabling duplicate detection \(hazards within 5 km and 24 hours are flagged as potential duplicates\) and proximity-based analysis \(identifying hazards near critical infrastructure\). 

● Spatial Indexing: GIST \(Generalized Search Tree\) indexes on geographic columns accelerate spatial queries, reducing query times from seconds to milliseconds even with tens of thousands of stored locations. 

● Administrative Assignment: Spatial joins between hazard coordinates and administrative boundary polygons automatically COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



assign each hazard to its correct province, municipality, and region, even when the original text provided imprecise location descriptions. 



PostGIS validation rejected 4.2% of geocoded locations as falling outside Philippine boundaries during evaluation, preventing false positives from ambiguous place names. Additionally, spatial duplicate detection identified 8.7% 

of incoming reports as duplicates of existing hazards, reducing redundancy and preventing alert fatigue. 

****

**Performance Evaluation and Linguistic Challenges** The hybrid Geo-NER pipeline was evaluated on a test set of 1,000 disaster reports comprising RSS news articles \(70%\), citizen submissions \(20%\), and government bulletins \(10%\). The dataset reflected real-world linguistic diversity: 55% pure English, 35% code-switched English-Filipino, and 10% pure Filipino/regional languages. 





COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 





**Location Type **

**Precision **

**Recall **

**F1-Score **

**Geocoding **

**Success Rate **

Provinces 

96% 

94% 

0.95 

94% 

Major Cities 

94% 

97% 

0.96 

97% 

\(HUCs/ICCs\) 

Municipalities 

89% 

88% 

0.89 

82% 

Barangays 

78% 

71% 

0.74 

68% 

Informal 

72% 

65% 

0.68 

61% 

References 

Overal 

91% 

89% 

0.90 

85% 





**Language Context** 

**Location Recall** 

**Geocoding Success** 

Pure English 

94% 

91% 

Code-Switched 

88% 

84% 

English-Filipino 

Pure Filipino 

82% 

76% 

Table 2.2 Geo-NER Performance by Location Type and Language COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



Performance was highest for formal administrative entities \(provinces and major cities\), where comprehensive pattern matching rules and high-quality OpenStreetMap coverage ensured reliable extraction and geocoding. Performance degraded for informal location references \(e.g., "near the public market in Tondo"\) and barangay-level entities, where incomplete geographic databases and ambiguous references posed challenges. 



**Linguistic Challenges and Solutions** 

● Code-Switching: Philippine disaster reports frequently mix English and Filipino within the same sentence \(e.g., "Baha sa Quezon City causes traffic sa Commonwealth Avenue"\). The hybrid approach handles this by combining BERT's contextual understanding \(which captures some code-switching patterns through pre-training on multilingual corpora\) with explicit pattern matching for Filipino location references. 

● Homonyms: Multiple locations share identical names \(e.g., eight municipalities named "San Juan" across different provinces\). The system resolves ambiguities using co-occurring location mentions \(if "Ilocos Sur" appears nearby, "San Juan" likely refers to the municipality in that province\), news source geography \(articles from Ilocos news outlets are more likely to reference local San COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



Juan\), and administrative hierarchy constraints \(if a region is mentioned, only locations within that region are considered\). 

● Informal Place Names: Filipinos frequently use informal location references such as landmarks \("near Robinson's"\), colloquial names \("Ortigas" for Ortigas Center\), or dialectal variants \("Dabaw" for Davao City\). The pattern matching database includes common colloquial aliases, while BERT-based NER occasionally captures informal references through contextual clues. However, coverage remains incomplete, future work will expand the alias database through crowdsourcing and social media mining. 

● Diacritics and Spelling Variations: Filipino place names may include diacritics \(e.g., "Parañaque" vs. "Paranaque"\) or exhibit spelling variations due to historical transcription differences. The system normalizes diacritics and implements fuzzy string matching \(Levenshtein distance ≤ 2\) to handle minor spelling variations while avoiding excessive false positives. 

● Regional Dialects: Beyond Filipino \(Tagalog\), the Philippines has over 180 languages and dialects. While the current system focuses on Filipino and English, future multilingual expansion will leverage XLM-RoBERTa's multilingual capabilities to process COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



reports in major regional languages such as Cebuano, Ilocano, and Hiligaynon. 



**Integration with Zero-Shot Classification **

Integrating Geo-NER with Zero-Shot Classification \(ZSC\) significantly enhances the capability of AI-driven hazard detection systems. While ZSC 

determines the type of hazard from unstructured text, Geo-NER identifies its geographic context, enabling the creation of dynamic hazard maps and facilitating informed emergency responses. For example, when processing the text "Flooding reported in several barangays of Marikina City due to heavy rainfall," ZSC 

classifies the hazard type as "flooding" with 0.89 confidence, while Geo-NER 

extracts "Marikina City," geocodes it to coordinates \(14.6507° N, 121.1029° E\), and maps it to "Metro Manila" region, producing a complete, actionable hazard record. 



This integrated pipeline operates automatically on RSS feeds every 5 

minutes, achieving an end-to-end processing time of 2.8 seconds per article \(0.3s for ZSC classification, 1.2s for Geo-NER extraction and geocoding, 0.8s for PostGIS validation, and 0.5s for database insertion\). The combined accuracy of the ZSC-Geo-NER pipeline, defined as the percentage of articles where both hazard type and location are correctly extracted, reached 84% on the evaluation COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



dataset, with 91% accuracy for hazard type classification and 89% for location extraction. 



The confidence scores from both ZSC and Geo-NER are combined using a weighted average \(0.6 weight for hazard classification, 0.4 weight for location extraction\) to produce an overall confidence score that determines routing: combined confidence ≥0.7 results in automatic verification, 0.3-0.7 routes to manual triage, and <0.3 leads to rejection. This dual-confidence approach ensures that records are only auto-verified when both the hazard type and location are confidently identified, reducing false positives while maintaining high throughput. 



**Operational Impact in GAIA **

Despite the challenges, the integration of Geo-NER into the GAIA framework provides a scalable, automated, and accurate method to bridge textual data with geospatial intelligence, ultimately improving disaster response efficiency and resource allocation. The system processes an average of 1,200 RSS 

articles daily from multiple Philippine news sources, successfully extracting and geocoding locations from approximately 1,020 articles \(85% success rate\). This automated extraction eliminates the need for manual location tagging, which would require an estimated 6-8 hours of daily human effort at a processing rate of 2-3 minutes per article. 



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



The geospatial accuracy achieved by the hybrid Geo-NER approach enables precise jurisdictional routing: when a hazard is detected in "Taguig City," 

alerts are automatically sent to Taguig City LGU officials, Metro Manila regional coordinators, and national-level monitors. This targeted notification system, powered by the administrative hierarchy mapping, ensures that appropriate responders are informed without overwhelming unaffected jurisdictions with irrelevant alerts. 



Furthermore, the PostGIS spatial database enables advanced analytical capabilities such as proximity alerts \(notifying LGUs when hazards occur near critical infrastructure like hospitals or evacuation centers\), trend analysis \(identifying regions with increasing hazard frequency\), and vulnerability mapping \(overlaying hazard locations with population density and infrastructure data\). 

These capabilities transform raw textual reports into actionable geospatial intelligence that supports strategic disaster preparedness and response planning. 



**Real-Time Geospatial Visualization **

Real-time geospatial visualization refers to the dynamic representation of spatial data as events occur, enabling decision-makers to monitor, analyze, and respond to emerging situations effectively. In disaster management, this capability is crucial for providing situational awareness to emergency responders, local COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



government units, and the public. By visualizing hazards on interactive maps, stakeholders can quickly identify affected areas, assess the scale of impact, and prioritize resource allocation \(MacEachren et al., 2011\). 



Modern platforms for real-time geospatial visualization often integrate Geographic Information Systems \(GIS\), web mapping frameworks such as Leaflet or Mapbox, and live data streams from sensors, satellites, or online reports. These tools allow users to interact with the data, filter layers, and gain insights into evolving hazard scenarios. For example, mapping flood-affected zones alongside infrastructure and population data enables authorities to coordinate evacuation routes and deploy emergency resources efficiently \(Liu et al., 2020\). 



In the context of GAIA, real-time geospatial visualization is the final output of the system, transforming unstructured textual information into actionable maps. By combining Zero-Shot Classification \(ZSC\) for hazard detection and Geo-NER for location extraction, GAIA can generate real-time hazard maps from online information streams, providing a comprehensive view of emerging environmental threats. This integration not only enhances situational awareness but also supports proactive disaster management and decision-making. 





COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



Challenges in real-time visualization include handling high-volume data streams, ensuring map accuracy, and maintaining low latency for timely updates. 

Nevertheless, advancements in cloud computing, geospatial analytics, and automated data pipelines continue to improve the feasibility and reliability of real-time hazard mapping systems. 



****

**Local and International Case Studies** 

Analyzing local and international case studies provides valuable insights into how disaster reporting and hazard detection systems have been implemented, highlighting successes, challenges, and lessons applicable to the Philippine context. 



In the Philippines, Project NOAH \(Nationwide Operational Assessment of Hazards\) serves as a flagship disaster risk reduction and management \(DRRM\) platform. Developed by the Department of Science and Technology \(DOST\), NOAH integrates satellite data, weather forecasts, and hydrological models to generate real-time hazard maps and early warning alerts. The platform has demonstrated significant effectiveness in monitoring floods, typhoons, and landslides, providing local governments and communities with actionable information to mitigate disaster risks \(DOST, 2015\). Another example is COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



GeoRiskPH, which emphasizes geospatial analytics and risk assessment for localized hazards, reinforcing the importance of integrating data-driven tools for proactive disaster management. 





Globally, platforms like Ushahidi in Kenya and FEMA’s integrated emergency management systems in the United States illustrate the application of technology in disaster reporting. Ushahidi, initially developed for crisis mapping during post-election violence in 2008, aggregates crowdsourced reports from SMS, email, and social media to visualize crisis events in real-time \(Okolloh, 2009\). FEMA, on the other hand, leverages multi-channel data inputs, geospatial visualization, and predictive analytics to coordinate nationwide disaster response efforts efficiently \(FEMA, 2022\). These systems highlight the importance of rapid data collection, automated processing, and geospatial representation for effective emergency response. 



These case studies reveal that integrating multiple data sources with real-time analysis and geospatial mapping significantly enhances situational awareness and decision-making. GAIA builds upon these lessons by focusing on unstructured textual data streams, applying Zero-Shot Classification for hazard detection, and using Geo-NER for location extraction. By doing so, it addresses a COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



gap in automated, location-aware hazard monitoring in the Philippines, complementing existing systems while extending capabilities to previously unseen or under-reported hazards. 

****

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

****

**Conceptual Framework **





Fig. 2.1 Input-Process-Output \(IPO\) 

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

****

**Definition of Terms **

For the readers to fully comprehend this study, the following are the notable terms that have been utilized in the study: **PWA \(Progressive Web Application\)** – A type of application software delivered through the web, built using standard web technologies, that offers an app-like user experience such as offline functionality, push notifications, and home-screen installation. 

**Artificial Intelligence \(AI\)** - A field of computer science focused on creating systems or machines capable of performing tasks that typically require human intelligence, such as reasoning, learning, problem-solving, perception, and natural language understanding. 

**Machine Learning \(ML\) ** - A branch of artificial intelligence \(AI\) that enables systems to automatically learn and improve from experience without being explicitly programmed, by analyzing data and identifying patterns. 

**Large Language Model \(LLM\) **- A type of AI model trained on vast amounts of text data, designed to understand, generate, and process natural language. ** **

**Zero-shot Learning \(ZSL\) **- A machine learning approach where a model can correctly recognize or classify data from classes it has never seen during training, by leveraging semantic relationships or descriptions. 

****

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

**Few-shot Learning \(FSL\) **- A machine learning technique where a model can generalize to new tasks using only a small number of labeled training examples, instead of requiring large datasets. 

**Dijkstra’s Algorithm** – A graph search algorithm that finds the shortest path between nodes in a weighted graph, widely used in network routing and pathfinding applications. 

**API \(Application Programming Interface\)** – A set of rules and protocols that allows different software applications to communicate with each other, enabling the integration and reuse of functionalities across platforms. 

**Project NOAH \(Nationwide Operational Assessment of Hazards\)** – A disaster risk reduction and management initiative originally launched by the Department of Science and Technology in 2012, and later adopted by the University of the Philippines. It provides real-time hazard maps and risk assessments for floods, storm surges, and landslides to enhance disaster preparedness and resilience** **

**Disaster Risk Reduction and Management \(DRRM\) – **A framework of policies and practices aimed at reducing disaster risks through prevention, preparedness, response, and recovery activities. ** **

**Named Entity Recognition \(NER\) – **A natural language processing technique used to identify and categorize entities in text, such as people, organizations, and locations. ** **

****

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

**Geographic Named Entity Recognition \(Geo-NER\) – **An extension of NER that links identified place names in text to geographic coordinates for mapping and situational awareness. 

**Zero-Shot Classification \(ZSC\) – **A machine learning method that categorizes text into labels without requiring prior labeled training data. ** **

**Natural Language Processing \(NLP\) – **A field of artificial intelligence focused on enabling machines to understand and process human language. ** **

**Multi-Channel Data Ingestion – **The integration of information from various input sources such as SMS, social media, and mobile applications into a unified processing pipeline. ** **

**Geospatial Visualization – **The presentation of location-based data in visual formats such as maps and dashboards to aid decision-making in crisis contexts. 





COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



****

**CHAPTER III **

****

**METHODOLOGY **

****

**Research Design **

This study employs a quantitative research design under an Agile development methodology. The quantitative approach focuses on objectively evaluating the performance and reliability of the GAIA system through measurable indicators such as model accuracy, precision, recall, and F1-score. 

Agile methodology, on the other hand, guides the system’s iterative development, allowing flexibility and continuous improvement based on performance outcomes and system testing results. 



The research design integrates two main phases: \(1\) System Development and \(2\) Model Evaluation. During system development, Agile sprints are used to incrementally design, build, and refine the GAIA framework. Each sprint involves planning, implementation, and testing cycles to ensure functionality aligns with the project’s objectives. 



The evaluation phase quantitatively measures the performance of the Zero-Shot Classification \(ZSC\) and Geospatial Named Entity Recognition \(Geo-NER\) components using real-world environmental hazard datasets. 

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



The ZSC component utilizes a robust 4-model fallback hierarchy built upon large language models to automatically classify environmental hazards from unstructured textual data. The primary classification mechanism leverages a transformer architecture, specifically the DeBERTa-v3 Pretrained Model \(MoritzLaurer/deberta-v3-base-zeroshot-v1.1-all-33\), due 

to 

its 

strong 

performance in zero-shot classification across diverse linguistic contexts. The model’s capability to detect unseen hazard categories without requiring labeled training data is tested using the standard machine learning metrics of Precision, Recall, F1-score, and Accuracy. Evaluation focuses on how effectively the model identifies relevant hazard categories within the Philippine environmental and linguistic contexts. 



The Geo-NER module uses a specialized model, dslim/bert-base-NER, to identify and map geospatial entities \(e.g., cities, provinces, landmarks\) mentioned in hazard reports. Its performance is quantitatively evaluated through its location extraction accuracy. The combined performance of both the ZSC and Geo-NER 

components is assessed through their seamless integration within the GAIA system to ensure real-time hazard detection and geospatial visualization. 



To maintain alignment with Agile principles, feedback from each testing iteration is used to refine model performance, improve system efficiency, and COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



enhance user interaction. The process continues until the system reaches stable functionality and acceptable evaluation metrics. All collected performance results are numerically analyzed to provide objective conclusions on the system’s effectiveness in environmental hazard detection and visualization.. 

****

****

**Sampling Technique **

This study utilizes a purposive sampling technique focused on the collection of relevant textual data from verified online news outlets and information sources. Unlike traditional research that involves human participants, this study draws its data exclusively from RSS feeds that report environmental hazards within the Philippine context. 



Purposive sampling is used because it ensures that only data relevant to the study’s objectives, such as hazard-related news, bulletins, and situational updates, are included in the dataset. The selection criteria prioritize news entries that explicitly mention or describe environmental hazard events such as floods, earthquakes, landslides, typhoons, and volcanic eruptions. 



Each sampled text entry serves as an input for the Zero-Shot Classification \(ZSC\) and Geospatial Named Entity Recognition \(Geo-NER\) models. 



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



The ZSC component, powered by the DeBERTa-v3 primary classifier, categorizes the hazard type, while the Geo-NER module, utilizing the dslim/bert-base-NER 

model, extracts corresponding location entities. To maintain data consistency and integrity, non-hazard-related or ambiguous entries are excluded from the dataset. 



The sample size depends on the number of valid hazard-related RSS 

entries collected over a fixed observation period. The study focuses solely on reports originating from or related to the Philippine archipelago, ensuring that the model evaluation aligns with the system’s intended operational context. 



This approach guarantees that the sampled data accurately represent real-world textual inputs encountered by the GAIA system, providing a valid basis for evaluating model performance in classifying hazards and identifying affected locations. 



**Participants of the Study **

The participants of the study primarily involve news organizations that publish environmental and disaster-related updates through RSS feeds. These outlets serve as the main data sources for GAIA, providing continuous streams of structured and unstructured textual information related to environmental hazards, such as floods, landslides, earthquakes, and typhoons. 



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



In addition, environmental officers, data analysts, and IT specialists act as system evaluators. They assess the performance, accuracy, and usability of the GAIA framework, particularly its ability to detect, classify, and visualize environmental incidents in real time. 



All data used are publicly accessible and contain no personal or sensitive information, ensuring compliance with ethical research and data privacy standards. 

****

**Research Locale **

The Philippine archipelago has been designated as the singular research locale and the exclusive geographical boundary for the GAIA framework. This selection is strategically driven by two primary factors: the country's unique, high-risk environmental profile, which necessitates advanced real-time detection systems, and the project’s specific goal of developing a crisis informatics tool tailored to the requirements of the national Disaster Risk Reduction and Management \(DRRM\) ecosystem. As a nation situated along the Pacific Ring of Fire and one of the most active global typhoon belts, the Philippines provides a continuous and diverse data environment \(characterized by concurrent hazards such as typhoons, earthquakes, volcanic eruptions, landslides, and complex flooding events\). This setting is ideal for the rigorous testing and validation of the COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



GAIA system, ensuring the framework is trained and evaluated on the full spectrum of real-world hazard reports. 



The constraints of the research locale are architecturally enforced within the system’s design. Specifically, the GAIA Input-Process-Output \(IPO\) architecture is configured to accept and process textual data streams almost exclusively from reputable Philippine news sources and RSS feeds, guaranteeing the relevance of the information. Crucially, the Geo-NER module, which extracts location names and utilizes the dslim/bert-base-NER model, is integrated with comprehensive geospatial reference data corresponding to Philippine administrative divisions \(provinces, cities, and municipalities\). This localized geospatial dictionary is used during the Validation and Filtering process to precisely geocode extracted entities and eliminate false positives or reports irrelevant to the operational scope. This intentional design limits the framework’s focus, ensuring that the final output, geolocated hazard markers, is consistently accurate and directly actionable by the designated end-users: Local Government Units \(LGUs\) and emergency responders within the Philippines. 



Furthermore, the locale profoundly influences the technical implementation of the Natural Language Processing components. News reports and public communication in the Philippines frequently exhibit code-switching COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



and contain localized linguistic features, blending English, Tagalog, and various regional dialects. The efficacy of the Zero-Shot Classification \(ZSC\) module, which utilizes the primary DeBERTa-v3 model, is contingent upon its ability to maintain semantic integrity and contextual understanding across these specific linguistic boundaries. By focusing on this challenging, domain-specific linguistic environment, the study aims to validate the framework's robustness, ensuring its output is fair and accurate across all regions of the country, thereby directly supporting equitable situational awareness for all disaster management stakeholders. 



**Research Instrument **

The GAIA framework's development and rigorous evaluation utilize a mixed set of technical and evaluative instruments. The process begins with Data Acquisition and Preprocessing, where continuous collection of real-time hazard reports from validated Philippine news outlets is anchored by RSS Feed Aggregators. This raw input stream is then processed using the Python Programming Language with libraries like NLTK/spaCy for cleaning and lemmatization. The cleaned data is structured using Pandas before entering the AI pipeline, ensuring the collected textual data is relevant and in a usable format for modeling. 





COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



The core functionality is driven by System Development Instruments. The Zero-Shot Classification \(ZSC\) Mechanism employs a robust 4-model fallback hierarchy, 

utilizing 

the 

DeBERTa-v3 

Pretrained 

Model 

\(MoritzLaurer/deberta-v3-base-zeroshot-v1.1-all-33\) as the primary instrument for categorization. Complementing this is the Geospatial Named Entity Recognition 

\(Geo-NER\) 

Model, 

which 

employs 

the 

specialized 

dslim/bert-base-NER model for extracting location names. The resulting hazard data is validated against Geospatial Reference Data managed in a PostgreSQL/PostGIS Database and presented to the user via a Progressive Web Application \(PWA\) visualized using GIS Libraries \(such as Leaflet or Mapbox\). 

All public submissions are secured via Cloudflare Turnstile to prevent automated abuse without compromising user privacy. 



The final phase, Performance and Usability Evaluation, uses both objective and subjective metrics. The objective assessment relies on Standard Machine Learning Metrics \(Accuracy, Precision, Recall, and F1-score\) to assess model efficacy against a ground truth dataset. Furthermore, a custom TtA logging mechanism is implemented in the data pipeline to objectively measure system Timeliness 

\(Time-to-Action\) 

using 

descriptive 

statistics. 

Lastly, 

a 

custom-designed Expert Usability and Timeliness Questionnaire is administered to domain specialists \(e.g., LGU staff, emergency officers\) to subjectively COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



evaluate operational factors like perceived usability and relevance for crisis decision-making. 



**Data Gathering Procedure **

The data gathering procedure for the GAIA framework is a systematic, multi-stage process designed to acquire, preprocess, and prepare the specific textual and geospatial data required for the training, validation, and testing of the Zero-Shot Classification \(ZSC\) and Geo-NER components. This procedure adheres strictly to the purposive sampling technique, ensuring the collected dataset is highly relevant, authoritative, and specific to real-time environmental hazard detection within the Philippine context. 



The process begins with Source Identification and Textual Data Collection. Raw, unstructured textual data is collected continuously from verified online news outlets and information sources within the Philippines \(e.g., major news agencies like GMA News, Inquirer.net, Rappler, and PhilStar\) using RSS 

Feed Aggregators. This method is chosen to capture the most immediate and domain-specific reports, which form the GAIA system's input stream. 



Once collected, the raw text undergoes Data Preprocessing and Annotation. The data is first cleaned using Python libraries \(NLTK/spaCy\) for COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



tasks like tokenization and lemmatization. For system evaluation, a comprehensive ground truth dataset \(200\+ articles\) was created through Manual Annotation by the research team, labeling each entry with the specific Hazard Type \(e.g., "Typhoon," "Landslide"\) and corresponding Geospatial Entities \(location names\). In the production system, however, this annotation process transforms into Triage-Based Validation, where low-confidence predictions \(< 70% certainty\) are automatically flagged for manual review by LGU validators, creating an ongoing feedback loop that continuously improves system accuracy over time. 



**System Development Process **

The GAIA framework was developed utilizing an Agile development methodology, a choice made to effectively manage the complexity inherent in integrating two distinct AI models: Zero-Shot Classification \(ZSC\) and Geospatial Named Entity Recognition \(Geo-NER\). This iterative approach facilitated continuous testing, rapid feedback, and seamless integration between the novel NLP components and the final output interface. The development commenced with the Architecture Design and Setup phase, which translated the conceptual Input-Process-Output \(IPO\) model into a functional technical blueprint. During this time, researchers defined data structures, established APIs for fetching real-time RSS feeds, and critically, configured the PostGIS database. 



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



This database was set up to manage high-volume incoming hazard reports and to house the static, authoritative Geospatial Reference Data \(Philippine administrative boundaries\) essential for later validation. 



Following the design phase, Component Development and Model Training began, focusing on the parallel, independent creation of the two core AI components. The Zero-Shot Classification \(ZSC\) Model, built upon the pretrained DeBERTa-v3 architecture, was fine-tuned using the annotated training set to enhance its semantic understanding of localized Philippine crisis reporting, thereby optimizing its Recall to minimize missed detections of critical, unseen hazard 

types. 

Simultaneously, 

the 

specialized 

Geo-NER 

Model 

\(dslim/bert-base-NER\) was trained to accurately identify location entities, with efforts focused on achieving high Precision in entity extraction to mitigate homonym and ambiguity issues common in geographical text. Intermediate performance checks were conducted against the validation set to ensure each model achieved stable functionality before the core integration step. 



The subsequent phase was Integration, Validation, and Geospatial Mapping, where the intellectual novelty of GAIA was realized. The two models were linked sequentially: the classified Hazard Type from the ZSC component was paired with the extracted Location from the Geo-NER component. A critical COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



Geospatial Validation routine was implemented, automatically passing raw Geo-NER output to the PostGIS database to match the extracted location names against the stored Geospatial Reference Data. Only locations that successfully matched an official Philippine administrative boundary were assigned validated coordinates. This strict filtering mechanism ensured geographic accuracy and relevance before the data was passed to the Mapping Engine Development component, which utilized front-end GIS Libraries \(like Leaflet\) to dynamically render the final real-time, interactive hazard map. 



The final stage involved Evaluation and Final Deployment. The complete GAIA framework, spanning from raw RSS input to the PWA map output, was rigorously tested on the reserved, unseen Testing Set. The system's performance was objectively measured using standard machine learning metrics \(Accuracy, F1-score\) and subjectively assessed by domain specialists via the Expert Usability and Timeliness Questionnaire. These results guided final refinements to optimize operational speed \(Time-to-Action, TtA\) and user experience. The system was then packaged and deployed as a fully functional Progressive Web Application \(PWA\), designed for operational continuity and ready for use by disaster management stakeholders. 





COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

**System Architecture **

**Layered Architecture: **

****

****

****

****

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

****

****

****

****

**Use Case Diagram: **

****

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

**C4 Model: **

Level 1: System Context Diagram 

****

****

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

****

****

Level 2: Container Diagram 



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

****

****

****





Level 3: Component Diagram 





COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

****

****

Level 4: Code Diagram 



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

**Data Analysis **

The data analysis procedure for the GAIA framework employs quantitative statistical analysis to evaluate both the technical efficacy of the core AI models and the system's operational performance metrics. 



**Stage 1: AI Model Performance Evaluation **

The first stage focuses on the objective performance of the Zero-Shot Classification \(ZSC\) and Geospatial Named Entity Recognition \(Geo-NER\) modules. Performance is quantitatively assessed using a reserved Testing Set evaluated against human-annotated Ground Truth data. The primary metrics computed include: 

● Accuracy, measuring overall correctness 

● Precision, assessing the rate of false alarms \(crucial for minimizing resource misallocation\) 

● Recall, assessing the rate of missed detections \(essential for capturing all reported hazards\) 

● F1-score, providing a balanced measure of performance \(particularly important for handling potentially imbalanced hazard datasets\) 

Furthermore, the quantitative analysis includes Algorithmic Fairness Analysis through statistical hypothesis testing \(ANOVA/Kruskal-Wallis\) COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



comparing F1-scores across different linguistic inputs \(English vs. Tagalog vs. 

Taglish\) and geographic regions to detect and quantify potential discriminatory bias in detection rates. Additionally, Uncertainty Quantification is statistically analyzed through correlation analysis between the ZSC model's confidence scores and prediction correctness to contextualize output reliability. 



**Stage 2: System Performance Evaluation **

The second stage focuses on the system's operational performance metrics, measured through automated logging and timestamp analysis. The system's Timeliness \(Time-to-Action, TtA\) is quantitatively analyzed using descriptive statistics \(mean, median, standard deviation, percentiles\) on the automatically logged elapsed time between the article publication timestamp \(from RSS 

metadata\) and the hazard marker's database insertion timestamp. The operational threshold of Median TtA < 5 minutes is used to verify if the system meets "near real-time" requirements. 



**Ethical Considerations **



In an IT research or capstone project, ethical considerations play a significant role in ensuring that the project is conducted responsibly and aligns with professional and societal standards. Here are key ethical considerations to keep in mind COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

**1. Data Privacy and Confidentiality **

● **Sensitive Information Protection**: Researchers must ensure that any personal or sensitive data \(e.g., health, financial, or identifiable information\) is protected and handled with strict confidentiality. 

● **Data Anonymization**: If the research involves user data, it's crucial to anonymize it to prevent identification of individuals. 



● **Compliance with Data Protection Laws**: Adherence to laws such as GDPR \(General Data Protection Regulation\) or HIPAA \(Health Insurance Portability and Accountability Act\) is essential when handling sensitive data. 

**3. Intellectual Property and Plagiarism **

● **Original Work**: Capstone projects should avoid plagiarism, ensuring proper citation of sources and acknowledgment of previous research. 

● **Copyright and Licensing**: Use of third-party software, libraries, or tools should respect copyright and licensing agreements. 

**4. Social Impact and Responsibility **

● **Impact on Society**: The potential societal effects of the project should be evaluated. Avoid projects that could have negative consequences, such as violating human rights or enabling harmful practices. 

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

● **Sustainability and Inclusivity**: Consider environmental sustainability and inclusivity, ensuring that technology developed benefits a broad range of users without discrimination. 

**5. Cybersecurity and Protection from Harm **

● **Ensuring Security**: If the project involves software development, ethical consideration must include building secure and resilient systems to protect users from cyber threats. 

● **Avoiding Harm**: Projects should avoid causing harm to individuals or systems, whether through negligence, vulnerabilities, or malicious design. 

**6. Bias and Fairness **

● **Algorithmic Bias**: If the project involves algorithms, ensure that they are fair and unbiased. Biased systems can lead to discriminatory outcomes, so fairness should be a priority. 

● **Transparency**: Be transparent about how data is used and analyzed to prevent hidden biases from affecting results. 

**7. Accountability and Integrity **

● **Accuracy in Reporting**: Researchers should report findings honestly, without fabricating, falsifying, or misrepresenting data or results. 

● **Responsibility for Actions**: Take responsibility for the ethical conduct of your research, including acknowledging any limitations or weaknesses in the study. 

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



**8. Dual-Use Technology **

● **Potential for Misuse**: Consider if the technology or research developed could be used for both beneficial and harmful purposes, and take steps to mitigate any risks of misuse. 

These ethical considerations ensure that an IT capstone project or research is conducted responsibly, safeguarding the interests of individuals, society, and the broader tech community. 





****



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

****

****

**LITERATURE CITED **

****

Fan, R., & Liu, L. \(2021\). Deep learning-based named entity recognition and knowledge graph construction for geological hazards. ISPRS Journal of Photogrammetry 

and 

Remote 

Sensing, 

175, 

1–13. 

https://www.mdpi.com/2220-9964/9/1/15 



Ghaffarian, S. \(2023\). Introducing digital risk twin for disaster risk management. 

Nature 

Communications, 

6\(1\), 

135. 

https://www.sciencedirect.com/science/article/pii/S2212420923006039?vi a%3Dihub 



Imran, M., Castillo, C., Diaz, F., & Vieweg, S. \(2015\). AIDR: Artificial intelligence for disaster response. Proceedings of the 24th International Conference 

on 

World 

Wide 

Web, 

159–162. 

https://dl.acm.org/doi/10.1145/2736277.2741135 



Long, Y. \(2017\). Zero-shot image classification \[Doctoral dissertation, University of 

Sheffield\]. 

White 

Rose 

eTheses 

Online. 

https://etheses.whiterose.ac.uk/id/eprint/18613/ 



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

International Telecommunication Union. \(2019\). Disaster Management and ICTs: Review 

of 

Emerging 

Trends. 

Retrieved 

from 

https://www.itu.int/hub/publication/d-stg-sg02-05-2-2021/ 



United Nations Economic and Social Commission for Asia and the Pacific. 

\(2024\). Harnessing digital technologies for disaster risk reduction in Asia and 

the 

Pacific. 

Retrieved 

from 

https://www.unescap.org/our-work/ict-disaster-risk-reduction United Nations Office for Disaster Risk Reduction. \(2023\). Global Assessment Report on Disaster Risk Reduction 2023: Mapping Resilience for the Sustainable 

Development 

Goals. 

Retrieved 

from 

https://www.undrr.org/gar/gar2023-special-report 



McDaniel, E. \(2024\). Zero-shot classification of crisis tweets using instruction-finetuned 

large 

language 

models. 

arXiv. 

https://arxiv.org/abs/2410.00182 



Rondinelli, A. \(2022\). Zero-shot topic labeling for hazard classification. 

Information, 13\(10\), 444. https://www.mdpi.com/2078-2489/13/10/444 



Jurafsky, D., & Martin, J. H. \(2024\). Speech and Language Processing \(4th ed., draft\). https://web.stanford.edu/~jurafsky/slp3/ 

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 



Gelernter, J., & Mushegian, N. \(2011\). Geo-parsing messages from microtext. 

Transactions 

in 

GIS, 

15\(6\), 

753–773. 

https://onlinelibrary.wiley.com/doi/10.1111/j.1467-9671.2011.01256.x 





MacEachren, A. M., Jaiswal, A., Robinson, A., Pezanowski, S., Savelyev, A., Mitra, P., & Blanford, J. \(2011\). Geo-Twitter analytics: Applications in crisis management. Cartography and Geographic Information Science, 38\(2\),171–185. https://icaci.org/files/documents/ICC\_proceedings/ICC201

1/Oral%20Presentations%20PDF/C3-Geovisualisation%20and%20data%2

0exploration/CO-244.pdf 



Havas, C., & Resch, B. \(2021\). Portability of semantic and spatial–temporal machine learning methods to analyse social media for near-real-time disaster monitoring. Natural Hazards. Advance online publication. 

https://link.springer.com/article/10.1007/s11069-021-04808-4 



COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 

UP NOAH Center. \(n.d.\). Nationwide Operational Assessment of Hazards \(NOAH\). University of the Philippines. https://noah.up.edu.ph/ 



FEMA. \(2022\). FEMA integrated emergency management. Federal Emergency Management 

Agency. 

https://www.fema.gov/emergency-managers/practitioners 



Okolloh, O. \(2009\). Ushahidi, or ‘testimony’: Web 2.0 tools for crowdsourcing crisis information. Participatory Learning and Action, 59\(1\), 65–70. 

https://www.iied.org/sites/default/files/pdfs/migrate/G02842.pdf 



Xian, Y., Schiele, B., & Akata, Z. \(2017\). Zero-Shot Learning — The Good, the Bad and the Ugly. arXiv. Retrieved from https://arxiv.org/pdf/1703.04394 





COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **





**LYCEUM OF THE PHILIPPINES UNIVERSITY** -** CAVITE** 





**APPENDICES * ***

****

****

****

****

****

****

****

****

****





* *

COLLEGE OF INFORMATION TECHNOLOGY AND COMPUTER SCIENCE ** **


# Document Outline

+   
+ TABLE OF CONTENTS  
+   
+   
+ LIST OF TABLES  
+ LIST OF FIGURES  
+ LIST OF APPENDICES  
+ LIST OF ABBREVIATIONS  
+ CHAPTER I   
	+ Background and Rationale of the Study  
	+ Objectives of the Study  
	+   
	+ Significance of the Study  
	+   
	+ Scope and Limitation  

+   
+   
+ CHAPTER II   
	+ Emergency and Disaster Reporting Systems  
	+ Role of ICT in Disaster Risk Reduction and Management  
	+   
	+ AI Applications in Disaster Management  
	+ Zero-Shot Text Classification  
	+   
	+ Named Entity Recognition \(NER\) and Geo-NER  
	+ Real-Time Geospatial Visualization  
	+   
	+ Local and International Case Studies  
	+   
	+   
	+   
	+ Conceptual Framework  
	+   
	+   
	+ Definition of Terms  

+   
+ CHAPTER III   
	+ Research Design  
	+   
	+ Sampling Technique  
	+ Participants of the Study  
	+ Research Locale  
	+ Research Instrument  
	+ Data Gathering Procedure  
	+ System Development Process  
	+   
	+ System Architecture  
	+ ​​  
	+ Level 2: Container Diagram  
	+ ​​​  
	+   
	+ ​​Level 4: Code Diagram  
	+   
	+ Data Analysis  
	+ Ethical Considerations  

+ LITERATURE CITED  
+ APPENDICES



