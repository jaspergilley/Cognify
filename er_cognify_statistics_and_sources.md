# Cognify — Statistics, Sources & Research Citations

All statistics used in the Cognify application, with their original sources and how they are applied in-app.

---

## Core Study: The ACTIVE Trial (2026)

| Statistic | Value | Context | Source |
|-----------|-------|---------|--------|
| Dementia risk reduction (speed training + boosters vs. control) | **25%** | 40% diagnosed vs. 49% in control group | Coe, N.B. et al. "Impact of Cognitive Training on Claims-Based Diagnosed Dementia Over 20 Years." *Alzheimer's & Dementia: TRCI*, 2026. DOI: 10.1002/trc2.70197 |
| Study sample size | **2,802** adults aged 65+ | Enrolled 1998–99, followed for 20 years | Same as above |
| Training protocol | **10 sessions, 60–75 min each, over 5–6 weeks** | Half received up to 4 booster sessions at 11 and 35 months | Same as above |
| Booster effect | Boosters were **essential** — initial training alone was not sufficient | Only the speed training + boosters group showed significant results | Same as above |
| Other interventions | Memory and reasoning training showed **no lasting effect** | First RCT to show any intervention reducing dementia over 20 years | Same as above |
| Follow-up data source | Medicare claims data from **2,021 participants** | Claims-based dementia diagnoses | Same as above |

**NIH Summary:** https://www.nih.gov/news-events/news-releases/cognitive-speed-training-over-weeks-may-delay-diagnosis-dementia-over-decades

---

## Processing Speed & Cognitive Aging

| Statistic | Value | Context | Source |
|-----------|-------|---------|--------|
| Age of processing speed decline onset | Begins in the **30s** | Among the first cognitive abilities to decline | Salthouse, T.A. "The Processing-Speed Theory of Adult Age Differences in Cognition." *Psychological Review*, 103(3), 403–428, 1996. University of Virginia. |
| Optimal training difficulty zone | **~79% accuracy threshold** | 3-up/1-down staircase converges here; challenging enough to drive improvement | Levitt, H. "Transformed Up-Down Methods in Psychoacoustics." *Journal of the Acoustical Society of America*, 49, 1971. |
| Transfer to everyday function | Speed training improved **IADL performance** | Instrumental Activities of Daily Living | Edwards, J.D. et al. *Journal of the American Geriatrics Society*, 53(4), 2005. University of South Florida. |
| Driving safety maintenance | UFOV training linked to **maintained driving safety** | At-fault crash risk reduction | Ball, K.K. et al. *Journal of the American Geriatrics Society*, 58(5), 2010. University of Alabama at Birmingham. |

---

## Cognitive Reserve & Brain Health

| Statistic | Value | Context | Source |
|-----------|-------|---------|--------|
| Cognitive reserve theory | Mental stimulation builds **neural resilience** | Helps brain compensate for age-related pathology | Stern, Y. "Cognitive Reserve." *Neuropsychologia*, 47(10), 2009. Columbia University. |
| Brain connectivity vs. age | Connectivity predicts cognition **better than chronological age** | Cambridge Centre for Ageing & Neuroscience population study | Shafto, M.A. et al. "The Cambridge Centre for Ageing and Neuroscience (Cam-CAN) study protocol." *BMC Neurology*, 14, 2014. |
| White matter integrity | Cognitive training **increases white matter integrity** | Supports faster neural communication | Lövdén, M. et al. "Experience-dependent plasticity of white-matter microstructure." *NeuroImage*, 49(1), 2010. Max Planck Institute. |
| Amyloid burden reduction | Cognitive engagement associated with **reduced amyloid burden** | A hallmark of Alzheimer's pathology | Landau, S.M. et al. "Association of Lifetime Cognitive Engagement and Low β-Amyloid Deposition." *Archives of Neurology*, 69(5), 2012. UC Berkeley / Lawrence Berkeley National Lab. |

---

## Meta-Analyses & Systematic Reviews

| Statistic | Value | Context | Source |
|-----------|-------|---------|--------|
| Computerized training efficacy | **52 studies** confirmed meaningful processing speed improvements | Meta-analysis of older adults | Lampit, A. et al. "Computerized Cognitive Training in Cognitively Healthy Older Adults: A Systematic Review and Meta-Analysis." *PLOS Medicine*, 11(11), 2014. University of Sydney. |
| Adaptive > fixed difficulty | Adaptive training produces **larger and more durable** gains | Compared to fixed-difficulty programs | Brehmer, Y. et al. "Working-memory training in younger and older adults." *Psychology and Aging*, 27(3), 2012. Karolinska Institute. |

---

## Institutional Guidelines & Frameworks

| Statistic | Value | Context | Source |
|-----------|-------|---------|--------|
| NIH Toolbox processing speed domain | Processing speed is a **core measurable cognitive domain** | Part of the NIH Toolbox Cognition Battery | Weintraub, S. et al. "Cognition assessment using the NIH Toolbox." *Neurology*, 80(11 Suppl 3), 2013. NIH / Northwestern University. |
| WHO recommendation | Cognitive training recommended for **dementia risk reduction** | Part of comprehensive approach for adults with normal cognition | World Health Organization. *Risk Reduction of Cognitive Decline and Dementia: WHO Guidelines*, 2019. |
| FINGER trial | Multimodal intervention (including cognitive training) **reduced cognitive decline risk** | At-risk older adults, 2-year RCT | Ngandu, T. et al. "A 2 year multidomain intervention of diet, exercise, cognitive training, and vascular risk monitoring." *The Lancet*, 385(9984), 2015. Karolinska Institute / University of Eastern Finland. |

---

## How Cognify Uses These Statistics In-App

### Personalized Risk Reduction Estimate
Based on the ACTIVE study's finding that 10–14 sessions + boosters → 25% risk reduction, Cognify scales a user's estimated risk reduction proportionally to their progress:
- **Sessions completed** (weight: 60%): progress toward 14 sessions
- **Speed improvement** (weight: 40%): millisecond improvement from baseline
- Formula: `riskReduction = min(25, (sessionFactor × 0.6 + improvementFactor × 0.4) × 25)`
- **Disclaimer:** This is an illustrative projection, not a personal medical prediction.

### Cognitive Health Benefit (Years)
Extrapolated from the 25% dementia risk reduction over 20 years:
- Maximum projected benefit: ~3.2 years of additional cognitive health
- Scales with sessions and improvement
- **Disclaimer:** Estimate based on population-level data from the ACTIVE study, not individual prediction.

### Age-Group Percentile
Processing speed thresholds compared against published normative data for age cohorts, derived from UFOV/processing speed research in the gerontological literature.

### Milestone Badges
Tied to the ACTIVE study protocol milestones:
- "First Session" — beginning the intervention
- "10 Sessions" — matching the core ACTIVE protocol
- "14 Sessions" — completing protocol + boosters
- Speed thresholds — unlocking harder exercises
- Weekly consistency — matching recommended training frequency

---

*All statistics are presented with their academic sources within the application. Cognify does not claim to prevent, treat, or cure dementia. All projections are illustrative estimates inspired by published research.*
