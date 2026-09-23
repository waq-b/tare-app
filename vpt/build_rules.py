"""Build training_rules, progression_rules, safety_rules (+ sources registry).

Each rule carries sources[] {title, org, url, year}, evidence_strength and licence.
`engine_default` flags values that are our synthesis rather than a quoted figure.
"""
import json

SRC = {
 "acsm2026": {"title": "ACSM Position Stand: Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults — An Overview of Reviews",
              "org": "American College of Sports Medicine (Phillips et al., MSSE)", "url": "https://acsm.org/resistance-training-guidelines-update-2026/", "year": 2026},
 "acsm2009": {"title": "Progression Models in Resistance Training for Healthy Adults (Position Stand)",
              "org": "American College of Sports Medicine (MSSE)", "url": "https://journals.lww.com/acsm-msse/fulltext/2009/03000/progression_models_in_resistance_training_for.26.aspx", "year": 2009},
 "nsca": {"title": "Essentials of Strength Training and Conditioning, 4th ed., ch. 17 (textbook; 5th ed. now published, not checked)", "org": "NSCA (Haff & Triplett)",
          "url": "https://ro.ecu.edu.au/ecuworkspost2013/1882/", "year": 2016},
 "schoenfeld2021": {"title": "Loading Recommendations for Muscle Strength, Hypertrophy, and Local Endurance: A Re-Examination of the Repetition Continuum",
                    "org": "Schoenfeld et al., Sports", "url": "https://www.mdpi.com/2075-4663/9/2/32", "year": 2021},
 "singer2024": {"title": "Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy",
                "org": "Singer et al., Frontiers in Sports and Active Living", "url": "https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1429789/full", "year": 2024},
 "grgic2018": {"title": "Effects of Rest Interval Duration in Resistance Training on Measures of Muscular Strength: A Systematic Review",
               "org": "Grgic, Schoenfeld et al., Sports Medicine", "url": "https://pubmed.ncbi.nlm.nih.gov/28933024/", "year": 2018},
 "pelland2026": {"title": "The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains",
                 "org": "Pelland, Remmert, Robinson, Hinson, Zourdos, Sports Medicine", "url": "https://link.springer.com/article/10.1007/s40279-025-02344-w", "year": 2026},
 "schoenfeld2017": {"title": "Dose-response relationship between weekly resistance training volume and increases in muscle mass",
                    "org": "Schoenfeld, Ogborn, Krieger, J Sports Sci", "url": "https://doi.org/10.1080/02640414.2016.1210197", "year": 2017},
 "robinson2024": {"title": "Exploring the Dose–Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy",
                  "org": "Robinson, Pelland, Remmert, Refalo et al., Sports Medicine", "url": "https://link.springer.com/article/10.1007/s40279-024-02069-2", "year": 2024},
 "refalo2024": {"title": "Similar muscle hypertrophy following eight weeks of resistance training to momentary muscular failure or with repetitions-in-reserve in resistance-trained individuals",
                "org": "Refalo et al., J Sports Sci", "url": "https://www.tandfonline.com/doi/full/10.1080/02640414.2024.2321021", "year": 2024},
 "hprc": {"title": "Guidelines to progress your physical training over time (citing NSCA)", "org": "Human Performance Resources by CHAMP (HPRC), US DoD",
          "url": "https://www.hprc-online.org/physical-fitness/training-performance/guidelines-progress-your-physical-training-over-time", "year": 2024},
 "helms2016": {"title": "Application of the Repetitions in Reserve-Based Rating of Perceived Exertion Scale for Resistance Training",
               "org": "Helms et al., Strength & Conditioning Journal", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4961270/", "year": 2016},
 "who2020": {"title": "WHO Guidelines on Physical Activity and Sedentary Behaviour", "org": "World Health Organization",
             "url": "https://www.ncbi.nlm.nih.gov/books/NBK566046/", "year": 2020},
 "cmo2019": {"title": "UK Chief Medical Officers' Physical Activity Guidelines", "org": "DHSC (UK)",
             "url": "https://www.gov.uk/government/publications/physical-activity-guidelines-uk-chief-medical-officers-report/uk-chief-medical-officers-physical-activity-guidelines", "year": 2019},
 "bell2023": {"title": "Integrating Deloading into Strength and Physique Sports Training Programmes: An International Delphi Consensus Approach",
              "org": "Bell et al., Sports Medicine – Open", "url": "https://link.springer.com/article/10.1186/s40798-023-00633-0", "year": 2023},
 "bell2024": {"title": "A Practical Approach to Deloading: Recommendations and Considerations for Strength and Physique Sports",
              "org": "Bell et al., Strength & Conditioning Journal (author manuscript)", "url": "https://shura.shu.ac.uk/35313/3/Bell-APracticalApproach(AM).pdf", "year": 2024},
 "coleman2024": {"title": "Gaining more from doing less? The effects of a one-week deload period during supervised resistance training on muscular adaptations",
                 "org": "Coleman et al., PeerJ", "url": "https://peerj.com/articles/16777/", "year": 2024},
 "ak2020": {"title": "The Minimum Effective Training Dose Required to Increase 1RM Strength in Resistance-Trained Men: A Systematic Review and Meta-Analysis",
            "org": "Androulakis-Korakakis et al., Sports Medicine", "url": "https://www.researchgate.net/publication/337716488", "year": 2020},
 "spiering2021": {"title": "Maintaining Physical Performance: The Minimal Dose of Exercise Needed to Preserve Endurance and Strength Over Time",
                  "org": "Spiering et al., J Strength Cond Res", "url": "https://doi.org/10.1519/jsc.0000000000003964", "year": 2021},
 # safety
 "nhs_chest": {"title": "Chest pain", "org": "NHS", "url": "https://www.nhs.uk/symptoms/chest-pain/", "year": 2026},
 "nhs_angina": {"title": "Angina", "org": "NHS", "url": "https://www.nhs.uk/conditions/angina/", "year": 2026},
 "nhs_999": {"title": "When to call 999", "org": "NHS", "url": "https://www.nhs.uk/nhs-services/urgent-and-emergency-care-services/when-to-call-999/", "year": 2026},
 "nhs_sprain": {"title": "Sprains and strains", "org": "NHS", "url": "https://www.nhs.uk/conditions/sprains-and-strains/", "year": 2026},
 "nhs_periods": {"title": "Stopped or missed periods", "org": "NHS", "url": "https://www.nhs.uk/conditions/stopped-or-missed-periods/", "year": 2026},
 "bhf_safe": {"title": "Exercising with a heart condition: finding a safe level", "org": "British Heart Foundation",
              "url": "https://www.bhf.org.uk/informationsupport/heart-matters-magazine/activity/finding-safe-exercise-limits", "year": 2024},
 "cddft": {"title": "Injuries, aches and pains", "org": "County Durham & Darlington NHS FT (physiotherapy)",
           "url": "https://www.cddft.nhs.uk/services/physiotherapy/patient-advice-and-information/injuries-aches-and-pains", "year": 2025},
 "cc_doms": {"title": "Delayed Onset Muscle Soreness (DOMS)", "org": "Cleveland Clinic (US)",
             "url": "https://my.clevelandclinic.org/health/diseases/delayed-onset-muscle-soreness", "year": 2024},
 "cc_sick": {"title": "Should you exercise when you're sick?", "org": "Cleveland Clinic (US)",
             "url": "https://health.clevelandclinic.org/should-i-still-work-out-if-im-sick-or-skip-it", "year": 2024},
 "ioc_reds": {"title": "2023 International Olympic Committee's consensus statement on Relative Energy Deficiency in Sport (REDs)",
              "org": "IOC / British Journal of Sports Medicine", "url": "https://pubmed.ncbi.nlm.nih.gov/37752011/", "year": 2023},
 "riebe2015": {"title": "Updating ACSM's Recommendations for Exercise Preparticipation Health Screening",
               "org": "Riebe et al., Medicine & Science in Sports & Exercise", "url": "https://pubmed.ncbi.nlm.nih.gov/26473759/", "year": 2015},
 "parq": {"title": "PAR-Q+ 2025 (terms of use)", "org": "PAR-Q+ Collaboration", "url": "https://eparmedx.com/?page_id=79", "year": 2025},
}
LIC = "Facts/figures cited from source; wording is ours. No source text reproduced."

def s(*keys): return [SRC[k] for k in keys]

# ---------------------------------------------------------------- training rules
training = {
 "version": "0.1.0",
 "notes": [
  "ACSM 2026 (overview of 137 reviews) supersedes ACSM 2009. Its big shift: hypertrophy is load-agnostic from ~30-100% 1RM when sets are taken close to failure; rest and periodisation matter less than once thought.",
  "Rep ranges below are DEFAULTS for plan generation, not hard rules. The validator should allow anything inside `allowed_*` ranges.",
  "Fields marked engine_default:true are our synthesis where sources give no exact figure.",
  "Weekly set counts use fractional counting: direct sets = 1.0, sets where the muscle is secondary = 0.5 (Pelland 2026).",
 ],
 "global": [
  {"rule": "min_frequency_per_muscle_per_week", "value": 2, "detail": "Train every major muscle group at least 2x/week.",
   "sources": s("acsm2026", "who2020", "cmo2019"), "evidence_strength": "strong", "licence": LIC},
  {"rule": "set_counting", "value": {"primary": 1.0, "secondary": 0.5}, "detail": "Fractional set counting fits the dose-response data best.",
   "sources": s("pelland2026"), "evidence_strength": "strong", "licence": LIC},
  {"rule": "exercise_order", "value": "compound_before_isolation", "detail": "Main multi-joint lifts first in the session.",
   "sources": s("acsm2026"), "evidence_strength": "moderate", "licence": LIC},
  {"rule": "full_range_of_motion", "value": True, "sources": s("acsm2026"), "evidence_strength": "moderate", "licence": LIC},
  {"rule": "rpe_rir_map", "value": {"10": 0, "9.5": "0-1", "9": 1, "8.5": "1-2", "8": 2, "7.5": "2-3", "7": 3, "6": "4+"},
   "detail": "RIR-based RPE scale (9.5 = no reps left but could add a little load). Novices gauge RIR less accurately; Helms advises they don't base progression on RIR alone yet, so bias beginner targets 1 RIR further from failure and lean on rep/load progression.",
   "sources": s("helms2016"), "evidence_strength": "moderate", "licence": LIC},
 ],
 "goals": [
  {"goal": "strength",
   "rep_range": [3, 6], "allowed_rep_range": [1, 12],
   "load_pct_1rm": [80, 95],
   "sets_per_exercise": [2, 4],
   "rest_seconds": [120, 180], "allowed_rest_seconds": [90, 300],
   "intensity_rpe": [7, 9],
   "weekly_sets_per_muscle": {"beginner": {"min": 4, "optimal": 8, "max": 12}, "intermediate": {"min": 6, "optimal": 10, "max": 15}},
   "frequency_per_muscle_per_week": [2, 3],
   "beginner_override": {"rep_range": [6, 10], "load_pct_1rm": [60, 75], "intensity_rpe": [6, 8]},
   "detail": "ACSM 2026: >=80% 1RM, 2-3 sets/exercise, >=2 sessions/wk. Strength gains flatten at lower volumes than hypertrophy; proximity to failure matters little for strength. Higher frequency helps strength.",
   "engine_default": ["rep_range", "weekly_sets_per_muscle", "beginner_override"],
   "sources": s("acsm2026", "acsm2009", "pelland2026", "robinson2024", "grgic2018"), "evidence_strength": "strong", "licence": LIC},
  {"goal": "hypertrophy",
   "rep_range": [6, 15], "allowed_rep_range": [5, 30],
   "load_pct_1rm": [30, 85],
   "sets_per_exercise": [2, 4],
   "rest_seconds": [90, 120], "allowed_rest_seconds": [60, 180],
   "intensity_rpe": [7, 9], "last_set_isolation_rpe": [9, 10],
   "weekly_sets_per_muscle": {"beginner": {"min": 4, "optimal": 10, "max": 15}, "intermediate": {"min": 10, "optimal": 14, "max": 22}},
   "frequency_per_muscle_per_week": [2, 3],
   "detail": "ACSM 2026: >=10 sets/muscle/week, more volume = more growth with diminishing returns; any load 30-100% 1RM works if sets end ~2-3 RIR. Frequency has no effect once weekly volume is matched, so 2x is a scheduling choice. Rest >60s slightly better, no benefit past ~90s.",
   "engine_default": ["rep_range", "weekly_sets_per_muscle.max", "frequency_per_muscle_per_week"],
   "sources": s("acsm2026", "schoenfeld2021", "pelland2026", "schoenfeld2017", "singer2024", "refalo2024", "robinson2024"),
   "evidence_strength": "strong", "licence": LIC},
  {"goal": "endurance",
   "rep_range": [15, 25], "allowed_rep_range": [12, 30],
   "load_pct_1rm": [30, 65],
   "sets_per_exercise": [2, 3],
   "rest_seconds": [45, 90], "allowed_rest_seconds": [20, 120],
   "intensity_rpe": [6, 8],
   "weekly_sets_per_muscle": {"beginner": {"min": 4, "optimal": 8, "max": 12}, "intermediate": {"min": 6, "optimal": 10, "max": 16}},
   "frequency_per_muscle_per_week": [2, 3],
   "detail": "ACSM 2026: RT improves muscular endurance but there isn't enough data for specific variables. Values are convention (ACSM 2009 / NSCA). ACSM 2009: <1 min rest for 10-15 rep sets, 1-2 min for 15-20+ rep sets. Tell the user this is lower-certainty.",
   "engine_default": ["rep_range", "rest_seconds", "weekly_sets_per_muscle"],
   "sources": s("acsm2026", "acsm2009", "nsca", "schoenfeld2021"), "evidence_strength": "weak", "licence": LIC},
  {"goal": "fat_loss",
   "inherits": "hypertrophy",
   "overrides": {"weekly_sets_per_muscle": {"beginner": {"min": 4, "optimal": 8, "max": 12}, "intermediate": {"min": 6, "optimal": 10, "max": 16}},
                 "intensity_rpe": [7, 9]},
   "detail": "No fat-loss-specific rep scheme exists in the evidence. Resistance training's job in a deficit is to KEEP muscle: keep load/intensity, trim volume if recovery suffers. Fat loss itself is driven by diet (and cardio). Don't invent 'fat-burning' rep ranges.",
   "engine_default": ["overrides"],
   "sources": s("acsm2026", "spiering2021"), "evidence_strength": "moderate", "licence": LIC},
  {"goal": "general",
   "rep_range": [8, 15], "allowed_rep_range": [5, 20],
   "load_pct_1rm": [40, 75],
   "sets_per_exercise": [1, 3],
   "rest_seconds": [60, 90], "allowed_rest_seconds": [30, 180],
   "intensity_rpe": [6, 8],
   "weekly_sets_per_muscle": {"beginner": {"min": 2, "optimal": 6, "max": 10}, "intermediate": {"min": 4, "optimal": 8, "max": 12}},
   "frequency_per_muscle_per_week": [2, 2],
   "detail": "WHO/UK CMO: muscle-strengthening at moderate+ intensity, all major muscle groups, >=2 days/week. 'Any strengthening is better than none.' Older adults: add balance work.",
   "engine_default": ["rep_range", "sets_per_exercise", "weekly_sets_per_muscle"],
   "sources": s("who2020", "cmo2019", "acsm2026"), "evidence_strength": "strong", "licence": LIC},
 ],
 "minimum_doses": [
  {"rule": "growth_minimum", "value": {"sets_per_muscle_per_week": 4, "rpe": [8, 10]},
   "detail": "Smallest dose that still reliably builds strength: ~1 hard set of 6-12 reps, 2-3x/week.",
   "engine_default": True, "sources": s("ak2020"), "evidence_strength": "moderate", "licence": LIC},
  {"rule": "maintenance_younger", "value": {"sessions_per_week": 1, "sets_per_exercise": 1, "keep_load": True},
   "detail": "Younger adults kept strength and muscle size for up to 32 weeks on 1 session/week, 1 set/exercise, as long as relative load (intensity) stayed the same. Use for busy weeks, holidays, illness recovery. (Exact age band not confirmed from full text.)",
   "sources": s("spiering2021"), "evidence_strength": "moderate", "licence": LIC},
  {"rule": "maintenance_older", "value": {"sessions_per_week": 2, "sets_per_exercise": [2, 3], "keep_load": True},
   "detail": "Older adults may need UP TO 2 sessions/week and 2-3 sets/exercise to keep muscle SIZE (strength may need less).",
   "sources": s("spiering2021"), "evidence_strength": "moderate", "licence": LIC},
 ],
 "conflicts": [
  {"topic": "rep_ranges", "summary": "NSCA/ACSM 2009 use fixed goal bands; ACSM 2026 and Schoenfeld 2021 say hypertrophy works across 30-100% 1RM.", "resolution": "Defaults + wide allowed_rep_range."},
  {"topic": "rest", "summary": "NSCA 30-90s for hypertrophy vs Singer 2024 (>60s slightly better, nothing past ~90s) vs ACSM 2026 (no consistent effect).", "resolution": "Default 90-120s; let user shorten."},
  {"topic": "effort", "summary": "Secondary write-ups quote ACSM 2026 as 1-2 RIR or 2-3 RIR; the paper text says 2-3.", "resolution": "Target 2-3 RIR; allow 0-1 on last isolation set."},
  {"topic": "frequency", "summary": "Schoenfeld 2016 favoured >=2x; 2019 and Pelland 2026 find no hypertrophy effect once volume matched. Frequency does help strength.", "resolution": "2x default; 3x for strength."},
  {"topic": "endurance_rest", "summary": "NSCA <=30s vs ACSM 2009 1-2 min for 15-20+ rep sets.", "resolution": "Default 45-90s, allow 20-120s."},
  {"topic": "volume_ceiling", "summary": "No agreed maximum; Pelland finds diminishing returns, not a plateau.", "resolution": "Cap at max and require good recovery signals to add sets."},
 ],
}

# ---------------------------------------------------------------- progression rules
progression = {
 "version": "0.1.0",
 "notes": ["ACSM 2026: progression isn't needed for health benefit, only for continued gains. Periodisation matters less than once thought.",
           "The '2-for-2' rule is NSCA's; ACSM 2009's variant is 1-2 reps over target on 2 consecutive sessions."],
 "methods": [
  {"method": "double_progression", "default_for": ["hypertrophy", "general", "endurance", "fat_loss"],
   "trigger": "All working sets hit the TOP of the rep range at or below target RPE, in 2 consecutive sessions.",
   "action": "Increase load by increment_pct (rounded to available plates), reset reps to bottom of range.",
   "increment_pct": {"upper": 2.5, "lower": 5.0}, "increment_kg_min": {"upper": 1.0, "lower": 2.5},
   "increment_kg_typical": {"upper": [1.0, 2.5], "lower": [2.5, 5.0]},
   "engine_default": ["increment_pct", "increment_kg_min"],
   "sources": s("acsm2009", "nsca"), "evidence_strength": "weak", "licence": LIC},
  {"method": "two_for_two", "default_for": ["strength"],
   "trigger": "2+ reps above target on the LAST set, in 2 consecutive sessions.",
   "action": "Add load.",
   "increment_kg": {"upper": {"novice": [1, 2.5], "trained": [2.5, 4.5]}, "lower": {"novice": [2.5, 4.5], "trained": [4.5, 7]}},
   "increment_lb_source": {"upper": {"novice": [2.5, 5], "trained": [5, 10]}, "lower": {"novice": [5, 10], "trained": [10, 15]}},
   "detail": "Increments from secondary sources citing NSCA (lb, converted and rounded to plates); the textbook table itself not checked. Scale down for dumbbells/isolation (smallest available jump).",
   "sources": s("nsca", "hprc"), "evidence_strength": "weak", "licence": LIC},
  {"method": "acsm_percentage", "trigger": "1-2 reps over target on 2 consecutive sessions.",
   "action": "Increase load 2-10%: lower end for small-muscle/isolation, upper end for large-muscle lifts.",
   "increment_pct": [2, 10], "sources": s("acsm2009"), "evidence_strength": "weak", "licence": LIC},
  {"method": "rpe_autoregulation", "trigger": "Logged RPE for the target reps is >= 1 point BELOW target for 2 sessions.",
   "action": "Increase load one increment. If RPE is >= 1 point ABOVE target for 2 sessions, hold or drop 5%.",
   "engine_default": True, "sources": s("helms2016"), "evidence_strength": "weak", "licence": LIC},
 ],
 "volume_progression": {
  "rule": "Add 1-2 sets per muscle per week at the start of a new block (every 3-6 weeks) if recovery signals are good, up to the goal's weekly max.",
  "requires": ["no pain flags", "session feel not 'hard' on >1/3 of sessions", "performance stable or rising"],
  "engine_default": True, "sources": s("pelland2026", "schoenfeld2017"), "evidence_strength": "moderate", "licence": LIC},
 "stall": {
  "definition": "No increase in reps or load on a lift for 3 consecutive sessions (or ~3 weeks).",
  "steps": [
   {"step": 1, "action": "check_recovery", "detail": "Look at sleep/energy/feel signals. If poor, deload before anything else."},
   {"step": 2, "action": "reset_load", "detail": "Drop load 5-10% and rebuild with the same progression method."},
   {"step": 3, "action": "swap_or_change_range", "detail": "Swap to an exercise from `swaps` with the same pattern, or shift the rep range."},
  ],
  "engine_default": True, "sources": s("nsca", "acsm2009"), "evidence_strength": "weak", "licence": LIC},
 "deload": {
  "every_n_weeks": [4, 6], "default_every_n_weeks": 5,
  "duration_days": 7, "duration_range_days": [3, 14],
  "method": "Cut volume first. Intensity may be held if volume is cut.",
  "volume_cut_pct": [40, 50], "intensity_cut_pct": [0, 10], "rir_increase": 2,
  "triggers": {
   "planned": "End of block (every_n_weeks).",
   "autoregulated": ["2+ lifts stalled in the same week", "session feel 'hard' or RPE above target on most sessions for 2 weeks",
                     "user reports persistent fatigue, poor sleep or low motivation", "returning from illness"]},
  "detail": "Deload guidance is expert consensus only. One 9-week RCT found a mid-programme 1-week deload gave similar hypertrophy but LESS lower-body strength gain (isometric and dynamic) than training straight through, so the case rests on fatigue management and adherence, not extra gains. Be honest about that in the UI.",
  "engine_default": ["volume_cut_pct", "intensity_cut_pct", "rir_increase", "autoregulated"],
  "sources": s("bell2023", "bell2024", "coleman2024"), "evidence_strength": "weak", "licence": LIC},
 "new_user_ramp": {
  "rule": "Weeks 1-2: sets at the goal's beginner min, RPE 6-7. Establish working weights. No AI suggestions beyond rules-only progression until 4 weeks of logs.",
  "engine_default": True, "sources": s("cmo2019", "acsm2026"), "evidence_strength": "moderate", "licence": LIC},
}

# ---------------------------------------------------------------- safety rules
def r(id_, trigger, action, msg, src, strength="strong", **kw):
    d = {"id": id_, "red_flag": trigger, "action": action, "user_message": msg, "sources": s(*src),
         "evidence_strength": strength, "licence": LIC, "llm_can_override": False}
    d.update(kw); return d

safety = {
 "version": "0.1.0",
 "notes": ["Actions (most to least urgent): stop_now_call_999 | stop_and_contact_111 | stop_and_see_gp | reduce_or_rest | modify_exercise | continue_with_caution.",
           "These rules run in code BEFORE and AFTER the LLM. The LLM can never downgrade an action.",
           "Messages are ours (UK English, calm). Not medical advice; the app should say so once in onboarding."],
 "rules": [
  r("chest_pain_emergency", "Sudden chest pain/discomfort that doesn't go away; OR pain spreading to arm, neck, jaw, stomach or back; OR chest pain with sweating, feeling sick, light-headedness or breathlessness.",
    "stop_now_call_999", "Please stop now and call 999. Chest pain like this needs checking straight away. Stay still and don't drive yourself.", ["nhs_chest", "nhs_999"]),
  r("angina_not_easing", "Known angina: symptoms still there 5 minutes after the second GTN dose.",
    "stop_now_call_999", "If your angina hasn't eased 5 minutes after your second spray, call 999 now.", ["nhs_angina"]),
  r("symptoms_during_exercise", "Chest pain, palpitations, dizziness or light-headedness DURING exercise.",
    "stop_and_see_gp", "Let's stop here and rest. If it doesn't settle quickly, call 999. If it settles, please see your GP before training again.",
    ["bhf_safe"], escalate_to="stop_now_call_999", escalate_if="not settling quickly, or any chest_pain_emergency feature present",
    gap="No source gives a minute threshold; escalate on any doubt."),
  r("chest_pain_intermittent", "Chest pain that comes and goes, or passed quickly but the user is still worried.",
    "stop_and_see_gp", "Chest pain that comes and goes is worth a GP visit. Let's keep things light until you've been seen.", ["nhs_chest"], block_intensity_above_rpe=6),
  r("angina_worsening", "Angina getting worse, more frequent, lasting longer, or happening at rest.",
    "stop_and_contact_111", "This change needs checking today. Please contact NHS 111.", ["nhs_angina"]),
  r("unsure_if_emergency", "User unsure whether a symptom is serious.",
    "stop_and_contact_111", "If you're not sure how serious it is, NHS 111 can check your symptoms and tell you what to do.", ["nhs_999"]),
  r("injury_severe", "Injury with a crack sound, deformity/odd angle, numbness or pins and needles, or skin blue/grey/cold.",
    "stop_now_call_999", "Please stop and go to A&E, or call 999. This may need an X-ray or urgent care.", ["nhs_sprain"]),
  r("injury_cant_bear_weight", "Can't bear weight or walk more than a few steps; pain or swelling severe or worsening; signs of infection (high temperature, hot/shivery).",
    "stop_and_contact_111", "Let's rest that area. Please contact NHS 111 today.", ["nhs_sprain"]),
  r("suspected_sprain_strain", "Suspected sprain or strain (pain, swelling, bruising after a twist or overstretch).",
    "reduce_or_rest", "Protect it, rest, ice, compress and elevate for 2-3 days. We'll ease back in gradually and work around it.",
    ["nhs_sprain"], rest_days=[2, 3], avoid_strenuous_weeks_max=8, typical_recovery_weeks=2,
    engine_action="Exclude exercises loading the flagged body area; resume at 50% volume."),
  r("calf_hot_swollen", "Calf that is hot, swollen, tender and tense to touch.",
    "stop_now_call_999", "Please stop and get medical help now. A hot, swollen, tender calf needs checking today.", ["cddft"], "moderate"),
  r("pain_not_settling_6wk", "Localised ache or injury not settling within 6 weeks.",
    "stop_and_see_gp", "This has gone on longer than usual. A GP or physio should take a look.", ["cddft"], "moderate"),
  r("doms_normal", "Dull, general muscle soreness starting 1-3 days after a hard or new session, easing within ~5 days.",
    "continue_with_caution", "That sounds like normal soreness after a harder session. Light movement helps and it should ease in a few days.",
    ["cc_doms"], "moderate", engine_action="Allow training; avoid hard sets on the sore muscle until soreness is mild."),
  r("pain_not_doms", "Soreness lasting more than 7 days; sharp or constant pain; severe swelling around a muscle; pain in a joint rather than muscle.",
    "stop_and_see_gp", "This doesn't sound like normal soreness. Please rest that area and see your GP.", ["cc_doms"], "moderate"),
  r("dark_urine", "Dark or blood-tinged (cola-coloured) urine after exercise, especially with severe muscle pain or weakness.",
    "stop_and_contact_111", "Dark urine after a hard session needs checking today. Please contact NHS 111 and drink water.",
    ["cc_doms"], "moderate", escalate_to="stop_now_call_999", escalate_if="severe pain, weakness or very little urine",
    gap="Escalation is our inference; no NHS page found."),
  r("illness_above_neck", "Illness with symptoms above the neck only (runny nose, congestion, mild sore throat).",
    "modify_exercise", "Light movement is usually fine with a head cold. Let's halve today's effort.",
    ["cc_sick"], "weak", engine_action="Cut volume and intensity by >=50%; low-impact only.",
    gap="'Neck check' is a US rule of thumb, not NHS guidance; label as guidance."),
  r("illness_below_neck", "Fever, chest tightness, difficulty breathing, vomiting, diarrhoea, body aches or whole-body fatigue.",
    "reduce_or_rest", "Your body needs rest to recover. A few days off won't undo your progress.",
    ["cc_sick"], "moderate", engine_action="No training until symptom-free; then 1 week at maintenance dose.", return_protocol="tr.dose.maintenance_younger"),
  r("missed_periods", "Missed 3 periods in a row, or cycle has become irregular, alongside heavy training or weight loss.",
    "stop_and_see_gp", "Missed periods can be a sign your body isn't getting enough energy for your training. Please see your GP. We'll ease the load in the meantime.",
    ["nhs_periods", "ioc_reds"], engine_action="Reduce volume 30-50% until reviewed."),
  r("low_energy_availability", "Ongoing fatigue and poor recovery, bone stress injury, falling libido, low mood, rapid weight loss, or feeling compelled to exercise. Any sex, any level.",
    "stop_and_see_gp", "Some of what you've described can happen when training outpaces fuel. It's worth a GP check. Let's lighten the plan and look at recovery.",
    ["ioc_reds"], "moderate", engine_action="Reduce volume; disable calorie-deficit suggestions; no 'push harder' messaging."),
  r("new_or_long_term_condition", "New to exercise, or has a long-term condition, with no symptoms.",
    "continue_with_caution", "Starting gently and building up is safe for almost everyone. The least active have the most to gain.",
    ["cmo2019"], engine_action="Apply new_user_ramp."),
  r("frailty_falls", "Frailty, moderate-to-severe dementia, vertebral fractures, or regular falls.",
    "modify_exercise", "For you, new exercises are best started with a physio or trainer first.", ["cmo2019"],
    engine_action="Don't generate a plan without supervision acknowledgement."),
 ],
 "screening": {
  "logic_source": s("riebe2015"),
  "evidence_strength": "strong",
  "questions": [
   {"id": "currently_active", "text": "In the last 3 months, have you done at least 30 minutes of planned moderate exercise on 3 or more days a week?", "type": "yes_no"},
   {"id": "known_disease", "text": "Has a doctor ever told you that you have a heart, metabolic (e.g. diabetes) or kidney condition?", "type": "yes_no"},
   {"id": "symptoms", "text": "Do you ever get any of these: chest, jaw or arm discomfort; breathlessness at rest or with light effort; dizziness or fainting; breathlessness lying flat; ankle swelling; a racing or fluttering heartbeat; calf pain when walking; a known heart murmur; or unusual tiredness with everyday activity?", "type": "yes_no"},
   {"id": "msk_issue", "text": "Do you have a bone, joint or muscle problem that exercise could make worse?", "type": "yes_no_with_area"},
   {"id": "supervised_only", "text": "Has a doctor told you to only exercise under medical supervision?", "type": "yes_no"},
  ],
  "questions_note": "Our own wording based on ACSM screening criteria. NOT PAR-Q+ (see parq_licence).",
  "matrix": {
   "symptoms=yes": {"result": "medical_clearance_first", "message": "Please check with your GP before starting. We'll be here when you're ready."},
   "supervised_only=yes": {"result": "medical_clearance_first", "message": "Your doctor has asked for supervised exercise, so please start with them first."},
   "currently_active=no,known_disease=no": {"result": "start_light_to_moderate", "max_rpe": 7},
   "currently_active=no,known_disease=yes": {"result": "medical_clearance_first"},
   "currently_active=yes,known_disease=no": {"result": "continue_progress_as_tolerated"},
   "currently_active=yes,known_disease=yes": {"result": "continue_moderate", "max_rpe": 7, "note": "GP clearance before vigorous work."},
   "msk_issue=yes": {"result": "modify", "engine_action": "Flag area; exclude/modify exercises loading it; suggest physio."},
  },
  "recheck": "Ask the symptoms question again if the user logs any pain/dizziness flag, and every 6 months.",
  "parq_licence": {"status": "do_not_reproduce",
                   "detail": "PAR-Q+ 2025 terms: materials must remain unaltered and may not be incorporated into electronic surveys or derivative materials without written consent. Options: request consent via https://eparmedx.com/contact-us/, or link out to the official PDF and record only the result.",
                   "sources": s("parq")},
 },
}

# ================================================================ v0.1.2 additions
SRC.update({
 "silbernagel2007": {"title": "Continued sports activity, using a pain-monitoring model, during rehabilitation in patients with Achilles tendinopathy: a randomized controlled study",
                     "org": "Silbernagel, Thomee, Eriksson, Karlsson, Am J Sports Med", "url": "https://pubmed.ncbi.nlm.nih.gov/17307888/", "year": 2007},
 "nhs_back_ex": {"title": "Exercises for back pain", "org": "NHS", "url": "https://www.nhs.uk/live-well/exercise/exercises-for-back-pain/", "year": 2026},
 "nhs_physio": {"title": "Physiotherapy: how to access it", "org": "NHS", "url": "https://www.nhs.uk/conditions/physiotherapy/accessing/", "year": 2026},
 "nhs_msk": {"title": "Get NHS help for back, muscle and joint problems (MSK self-referral)", "org": "NHS",
             "url": "https://www.nhs.uk/nhs-services/get-nhs-help-for-back-joint-problems/", "year": 2026},
 "nhs_gp": {"title": "Find a GP", "org": "NHS", "url": "https://www.nhs.uk/service-search/find-a-gp", "year": 2026},
 "nhs_111": {"title": "NHS 111 online", "org": "NHS England", "url": "https://111.nhs.uk/", "year": 2026},
 "nhs_111_wales": {"title": "NHS 111 Wales", "org": "NHS Wales", "url": "https://111.wales.nhs.uk/", "year": 2026},
 "nhs24": {"title": "NHS 24", "org": "NHS Scotland", "url": "https://www.nhs24.scot/", "year": 2026},
 "ni_ooh": {"title": "GP out of hours service", "org": "nidirect (Northern Ireland)", "url": "https://www.nidirect.gov.uk/articles/gp-out-hours-service", "year": 2026},
 "csp_find": {"title": "Find a physiotherapist (Physio2u)", "org": "Chartered Society of Physiotherapy",
              "url": "https://www.csp.org.uk/public-patient/find-physiotherapist/physio2u", "year": 2026},
 "epley1985": {"title": "Poundage Chart. In: Boyd Epley Workout", "org": "Epley B., Body Enterprises", "url": "https://en.wikipedia.org/wiki/One-repetition_maximum", "year": 1985},
 "reynolds2006": {"title": "Prediction of one repetition maximum strength from multiple repetition maximum testing and anthropometry",
                  "org": "Reynolds, Gordon, Robergs, J Strength Cond Res", "url": "https://www.unm.edu/~rrobergs/478RMStrengthPrediction.pdf", "year": 2006},
 "lesuer1997": {"title": "The accuracy of prediction equations for estimating 1-RM performance in the bench press, squat, and deadlift",
                "org": "LeSuer et al., J Strength Cond Res", "url": "https://journals.lww.com/nsca-jscr/abstract/1997/11000/the_accuracy_of_prediction_equations_for.1.aspx", "year": 1997},
 "saeterbakken2011": {"title": "A comparison of muscle activity and 1-RM strength of three chest-press exercises with different stability requirements",
                      "org": "Saeterbakken, van den Tillaar, Fimland, J Sports Sci", "url": "https://pubmed.ncbi.nlm.nih.gov/21225489/", "year": 2011},
 "cotterman2005": {"title": "Comparison of muscle force production using the Smith machine and free weights for bench press and squat exercises",
                   "org": "Cotterman, Darby, Skelly, J Strength Cond Res", "url": "https://pubmed.ncbi.nlm.nih.gov/15705030/", "year": 2005},
 "kolber2014": {"title": "Characteristics of shoulder impingement in the recreational weight-training population",
                "org": "Kolber et al., J Strength Cond Res", "url": "https://elementssystem.com/wp-content/uploads/2018/06/Kolber.pdf", "year": 2014},
 "ribeiro2014": {"title": "Effect of different warm-up procedures on the performance of resistance training exercises",
                 "org": "Ribeiro, Romanzini, Schoenfeld et al., Perceptual and Motor Skills", "url": "https://journals.sagepub.com/doi/10.2466/25.29.PMS.119c17z7", "year": 2014},
 "ribeiro2020": {"title": "The Role of Specific Warm-up during Bench Press and Squat Exercises: A Novel Approach",
                 "org": "Ribeiro, Neiva et al., Int J Environ Res Public Health", "url": "https://www.mdpi.com/1660-4601/17/18/6882", "year": 2020},
 "foster2001": {"title": "A new approach to monitoring exercise training", "org": "Foster et al., J Strength Cond Res",
                "url": "https://pubmed.ncbi.nlm.nih.gov/11708692/", "year": 2001},
 "day2004": {"title": "Monitoring exercise intensity during resistance training using the session RPE scale",
             "org": "Day, McGuigan, Brice, Foster, J Strength Cond Res", "url": "http://formacion.ferugby.es/wp-content/uploads/2019/04/Monitoring-Exercise-Intensity-During-Resistance-Training_RPE.pdf", "year": 2004},
 "haddad2017": {"title": "Session-RPE Method for Training Load Monitoring: Validity, Ecological Usefulness, and Influencing Factors",
                "org": "Haddad et al., Frontiers in Neuroscience", "url": "https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2017.00612/full", "year": 2017},
 "martinfuentes2020": {"title": "Electromyographic activity in deadlift exercise and its variants. A systematic review",
                       "org": "Martin-Fuentes, Oliva-Lozano, Muyor, PLoS One", "url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0229507", "year": 2020},
})

SET_EFFORT = {"easy": {"rpe": [1, 6], "rir": "4+"}, "ok": {"rpe": [7, 8], "rir": "2-3"}, "hard": {"rpe": [9, 10], "rir": "0-1"}}
SESSION_FEEL = {"easy": {"srpe_cr10": [1, 3]}, "good": {"srpe_cr10": [4, 6]}, "tough": {"srpe_cr10": [7, 8]}, "wrecked": {"srpe_cr10": [9, 10]}}

NEW_GLOBAL = [
 {"rule": "effort_set_map", "value": SET_EFFORT,
  "detail": "Sets are logged Easy / OK / Hard. Each maps to an RPE/RIR band on the Helms scale. Progression uses them like this: "
            "'at or below target RPE' = Easy or OK; 'above target' = Hard (except the last set of an isolation exercise, where RPE 9-10 is the target); "
            "'RPE >= 1 below target' (pr.rpe_autoregulation) = Easy. Novices misjudge RIR, so rep/load progression stays primary.",
  "used_by": ["pr.double_progression", "pr.rpe_autoregulation", "pr.two_for_two", "tr.global.rpe_rir_map"],
  "engine_default": True, "sources": s("helms2016"), "evidence_strength": "weak", "licence": LIC},
 {"rule": "effort_session_map", "value": SESSION_FEEL,
  "definitions": {"hard_session": ["tough", "wrecked"], "very_hard_session": ["wrecked"]},
  "detail": "Session feel Easy / Good / Tough / Wrecked maps to the session-RPE (CR-10) scale, asked ~30 min after the session. "
            "A 'hard session' anywhere in these rules means Tough or Wrecked.",
  "used_by": ["pr.volume_progression", "pr.deload"],
  "engine_default": True, "sources": s("foster2001", "day2004", "haddad2017"), "evidence_strength": "moderate", "licence": LIC},
 {"rule": "warm_up", "value": {
   "applies_to": "first exercise for each movement pattern in a session, when it's a compound lift with external load",
   "ramp": [{"pct_working_load": 50, "reps": 5}, {"pct_working_load": 75, "reps": 3}, {"pct_working_load": 90, "reps": 1,
             "only_if": "working reps <= 6"}],
   "optional_first": {"load": "empty bar or lightest option", "reps": 10},
   "later_exercises": {"pct_working_load": 50, "reps": 8, "sets": 1, "optional": True},
   "rounding": "round down to the nearest available increment; skip a step if it rounds to the same load as the previous one",
   "counts_for_progression": False, "counts_for_volume": False},
  "detail": "Evidence says a specific warm-up with a heavier set (~80% of working load) beats light sets alone, but there's little agreement on the best ladder. "
            "The ramp here is our convention. Warm-up sets are never used for progression, e1RM or weekly volume.",
  "engine_default": True, "sources": s("ribeiro2020", "ribeiro2014"), "evidence_strength": "weak", "licence": LIC},
 {"rule": "e1rm", "value": {"formula": "epley", "expression": "load * (1 + reps / 30)", "max_reps": 10,
   "only_sets": "working sets (not warm-ups), reps >= 1; reps == 1 returns the load", "label": "estimated"},
  "detail": "Epley formula. Accuracy drops above ~10 reps (Reynolds 2006: use no more than 10 reps); the app asked for <=12, but the data caps it at 10. "
            "Prediction equations tend to underestimate squat and deadlift. Always shown as 'estimated'.",
  "engine_default": True, "sources": s("epley1985", "reynolds2006", "lesuer1997"), "evidence_strength": "moderate", "licence": LIC},
 {"rule": "swap_starting_load", "value": {
   "method": "Convert via the old exercise's recent working load (or e1RM), apply the ratio, then the safety margin, then round DOWN.",
   "safety_margin": 0.9,
   "ratios": [
    {"from": "barbell", "to": "dumbbell", "ratio_per_hand": 0.41, "patterns": ["push_h", "push_v"], "basis": "DB 1RM (both hands) ~17% below barbell bench"},
    {"from": "dumbbell", "to": "barbell", "ratio_from_per_hand": 2.0, "note": "sum of both dumbbells; no uplift taken"},
    {"from": "barbell", "to": "smith_machine", "ratio": 0.9, "patterns": ["push_h"], "basis": "Smith bench 3-14% below free bench"},
    {"from": "barbell", "to": "smith_machine", "ratio": 0.95, "patterns": ["squat"], "basis": "Smith squat ~4% above free squat; kept conservative"},
    {"from": "bilateral", "to": "unilateral", "ratio_per_side": 0.4},
   ],
   "no_reliable_ratio": ["machine <-> free weight (except Smith)", "cable <-> anything", "bodyweight <-> loaded", "different movement pattern"],
   "calibrate_instead": "Where no ratio applies: suggest a light first set (target RPE <= 6 / effort Easy), then adjust by one increment per set.",
   "first_session_target": "effort OK or Easy on all sets (RPE <= 7)"},
  "detail": "Example: 70 kg barbell bench -> 70 x 0.41 x 0.9 = 25.8 -> 24 or 25 kg dumbbells per hand (round down to what the gym has). "
            "Ratios come from single studies; the margin and rounding keep it conservative.",
  "engine_default": True, "sources": s("saeterbakken2011", "cotterman2005"), "evidence_strength": "weak", "licence": LIC},
 {"rule": "muscle_group_rollup", "value": {"map": "exercises.json -> muscle_groups",
   "per_set_credit": "a set credits a group with the MAX of its member muscles' credit (1.0 primary / 0.5 secondary), not the sum",
   "targets": "volume targets stay per muscle (tr.goal.* weekly_sets_per_muscle). Rolled-up numbers are for display only and are never compared to a target. "
              "If a group target is shown, use the member muscle with the lowest progress against its own target."},
  "detail": "Stops a lat pulldown counting 1.5 sets of 'Back' because lats (1.0) and middle back (0.5) are both in the group. Stabilisers never count.",
  "engine_default": True, "sources": s("pelland2026"), "evidence_strength": "weak", "licence": LIC},
 {"rule": "push_pull_balance", "value": {"kind": "nudge", "hard_rule": False,
   "check": "weekly working sets of pull_h + pull_v < weekly sets of push_h + push_v",
   "suggestion": "Consider adding a row, face pull or rear-delt fly."},
  "detail": "No position stand gives a push:pull ratio; 1:1 or 2:1 is coaching convention. One cross-sectional study found fewer shoulder impingement signs in "
            "recreational lifters who trained external rotators. Show as a gentle suggestion, never as a target or warning.",
  "engine_default": True, "sources": s("kolber2014"), "evidence_strength": "weak", "licence": LIC},
]
NEW_GLOBAL_IDS = {r["rule"]: f"tr.global.{r['rule']}" for r in NEW_GLOBAL}
training["global"] += NEW_GLOBAL
training["notes"].append("v0.1.2: stabilisers (exercises.json) are never counted in weekly volume; only primary (1.0) and secondary (0.5) are.")

# hard-session definitions wired into progression (text kept, structured fields added)
progression["volume_progression"]["requires"] = ["no pain flags", "session feel not 'hard' (Tough or Wrecked) on >1/3 of sessions",
                                                 "performance stable or rising"]
progression["volume_progression"]["requires_structured"] = {
  "pain_flags_in_block": 0, "hard_session_share_max": 0.33, "wrecked_sessions_last_14_days_max": 0,
  "performance": "e1RM or reps at same load stable or rising on most lifts",
  "definitions": "tr.global.effort_session_map"}
progression["deload"]["triggers"]["autoregulated"] = [
  "2+ lifts stalled in the same week",
  "session feel 'hard' (Tough or Wrecked) or set effort above target on most sessions for 2 weeks",
  "user reports persistent fatigue, poor sleep or low motivation", "returning from illness"]
progression["deload"]["triggers"]["autoregulated_structured"] = {
  "stalled_lifts_same_week_min": 2, "hard_session_share_2wk_min": 0.5, "wrecked_sessions_14_days_min": 2,
  "definitions": "tr.global.effort_session_map"}
progression["deload"]["deload_sets"] = {"counts_for_progression": False, "counts_for_volume": True}

# ---- safety: services, per-rule service links, mid-session pain rule, screening copy + GP path
SERVICES = {
 "emergency_999": {"label": "Call 999", "tel": "999", "url": SRC["nhs_999"]["url"], "regions": ["england", "wales", "scotland", "northern_ireland"],
                   "note": "Life-threatening emergencies."},
 "nhs_111": {"label": "NHS 111", "tel": "111",
             "online": {"england": SRC["nhs_111"]["url"], "wales": SRC["nhs_111_wales"]["url"], "scotland": SRC["nhs24"]["url"]},
             "northern_ireland": {"tel": None, "use": "GP out of hours service (numbers vary by area)", "url": SRC["ni_ooh"]["url"]},
             "note": "Urgent but not life-threatening, or not sure. Free from landlines and mobiles in England, Wales and Scotland (NHS 24 in Scotland). No 111 in Northern Ireland."},
 "gp_finder": {"label": "Find a GP", "url": SRC["nhs_gp"]["url"], "note": "England. Most people contact their own GP practice directly."},
 "physio_self_referral": {"label": "Refer yourself to physio", "url": SRC["nhs_msk"]["url"], "info_url": SRC["nhs_physio"]["url"],
                          "note": "In many areas of England you can refer yourself to NHS musculoskeletal (MSK) services, including physiotherapy, without seeing a GP. Not for urgent problems."},
 "private_physio": {"label": "Find a private physio", "url": SRC["csp_find"]["url"]},
}
ACTION_SERVICES = {"stop_now_call_999": ["emergency_999"], "stop_and_contact_111": ["nhs_111", "emergency_999"],
                   "stop_and_see_gp": ["gp_finder", "nhs_111"], "reduce_or_rest": [], "modify_exercise": [], "continue_with_caution": []}
MSK_RULES = {"pain_not_settling_6wk", "pain_not_doms", "suspected_sprain_strain", "pain_during_exercise"}

safety["rules"].insert(safety["rules"].index(next(r for r in safety["rules"] if r["id"] == "doms_normal")), r(
  "pain_during_exercise",
  "Pain in a joint or area that comes on or gets worse during an exercise, feels sharp or catching, or goes above about 5 out of 10. "
  "No red-flag signs (see the 999/111 rules).",
  "modify_exercise",
  "Let's stop this exercise and leave that area alone for today. You can carry on with anything that feels comfortable. "
  "If it's still sore tomorrow, rest it. If it isn't getting better after a couple of weeks, or it's affecting everyday life, see your GP or a physio.",
  ["nhs_back_ex", "nhs_sprain", "silbernagel2007"], "moderate",
  engine_action="Stop the current exercise. Skip remaining exercises whose body_areas include the flagged area as primary "
                "(exercises.json -> body_area_map). Log a pain flag with area and side. Next session: exclude the same set; "
                "if the user reports it has settled, reintroduce at 50% of previous load.",
  escalate=[{"if": "can't bear weight, swelling getting worse, or signs of infection", "to": "injury_cant_bear_weight"},
            {"if": "crack sound, deformity, numbness or cold/blue skin", "to": "injury_severe"},
            {"if": "still painful the next day, or worse", "to": "reduce_or_rest (area)"},
            {"if": "not improving after ~2 weeks, or limits daily life", "to": "pain_not_doms"}],
  precedence="Mid-session pain routes here first. Pain that persists after the session or lasts >7 days routes to pain_not_doms.",
  gap="'Sharp' and the 5/10 threshold come from physiotherapy practice (pain-monitoring model, tendon RCT); NHS wording is 'stop if your pain gets worse'."))

for rule in safety["rules"]:
    svc = list(ACTION_SERVICES[rule["action"]])
    if rule["id"] in MSK_RULES: svc += ["physio_self_referral"]
    rule["services"] = svc
safety["services"] = SERVICES
safety["notes"].append("v0.1.2: `services` holds UK contacts; each rule lists the services to offer (by key). The app owns the label per action; user_message is the body, verbatim.")

MATRIX_MSG = {
 "currently_active=no,known_disease=no": "Good to go. We'll start gently and build up over the first few weeks, which is the safest way to begin.",
 "currently_active=no,known_disease=yes": "Because of your condition, please check with your GP before you start. Once they're happy, you can carry on setting up.",
 "currently_active=yes,known_disease=no": "You're all set. We'll build from where you are now and progress as you're ready.",
 "currently_active=yes,known_disease=yes": "Keep going at a moderate level. Before you move on to very hard sessions, have a quick chat with your GP.",
 "msk_issue=yes": "Thanks for telling us. We'll plan around that area, and a physio can help if it's bothering you. You can refer yourself in many areas.",
}
for k, msg in MATRIX_MSG.items():
    safety["screening"]["matrix"][k].setdefault("message", msg)
safety["screening"]["result_messages"] = {
 "medical_clearance_first": "Please have a chat with your GP before you start. When they're happy for you to exercise, come back and tell us, and you can carry on.",
 "start_light_to_moderate": MATRIX_MSG["currently_active=no,known_disease=no"],
 "continue_progress_as_tolerated": MATRIX_MSG["currently_active=yes,known_disease=no"],
 "continue_moderate": MATRIX_MSG["currently_active=yes,known_disease=yes"],
 "modify": MATRIX_MSG["msk_issue=yes"],
}
safety["screening"]["cleared_by_gp"] = {
 "applies_to": "medical_clearance_first",
 "question": {"id": "cleared_by_gp", "text": "Have you spoken to your GP (or doctor) and been told it's OK for you to exercise?", "type": "yes_no"},
 "if_yes": {"result": "start_light_to_moderate", "max_rpe": 7, "record": ["date_confirmed"],
            "optional_note": "Anything your GP asked you to avoid? (free text, shown on your plan)",
            "message": "Great, thanks. We'll start gently. If your GP gave you any limits, add them and we'll keep to them."},
 "if_no": {"result": "medical_clearance_first", "setup_blocked": True, "dead_end": False,
           "offer": ["gp_finder", "nhs_111", "save_progress_and_remind"],
           "message": "No problem. Your answers are saved, so you can pick up where you left off once you've spoken to them."},
 "still_applies": "In-session safety rules and the symptoms recheck still apply after clearance. If symptoms were the reason, clearance lifts setup only; any new symptom routes to the safety rules.",
 "evidence_strength": "strong", "sources": s("riebe2015"), "licence": LIC}
safety["screening"]["recheck"] = safety["screening"]["recheck"] + " Clearance is recorded with a date; it does not skip the recheck."

# ================================================================ v0.1.3 additions
SRC.update({
 "keller2013": {"title": "Strength and muscle mass loss with aging process. Age and strength loss",
                "org": "Keller, Engelhardt, Muscles Ligaments Tendons J", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3940510/", "year": 2013},
 "goodpaster2006": {"title": "The loss of skeletal muscle strength, mass, and quality in older adults: the Health, Aging and Body Composition Study",
                    "org": "Goodpaster et al., J Gerontol A Biol Sci Med Sci", "url": "https://pubmed.ncbi.nlm.nih.gov/17077199/", "year": 2006},
 "fragala2019": {"title": "Resistance Training for Older Adults: Position Statement From the National Strength and Conditioning Association",
                 "org": "Fragala et al., J Strength Cond Res", "url": "https://doi.org/10.1519/JSC.0000000000003230", "year": 2019},
 "grgic2020": {"title": "Test-Retest Reliability of the One-Repetition Maximum (1RM) Strength Assessment: a Systematic Review",
               "org": "Grgic et al., Sports Medicine – Open", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7367986/", "year": 2020},
 "cooper_bench": {"title": "1-RM bench press to body weight norms by age and sex (Cooper Institute data, as reprinted in ACE's 1-RM Bench-Press Assessment Protocol)",
                  "org": "The Cooper Institute / American Council on Exercise", "url": "https://contentcdn.eacefitness.com/assets/certification/ace-answers/forms/pt/38_Bench-Press_Assessment_Protocol.pdf", "year": 2020},
 "brown1998": {"title": "Normative data for strength and flexibility of women throughout life",
               "org": "Brown, Miller, Eur J Appl Physiol", "url": "https://pubmed.ncbi.nlm.nih.gov/9660160/", "year": 1998},
 "ma2025": {"title": "Effect of cluster set resistance training combined with HIIT in untrained young men (baseline 1RMs)",
            "org": "Ma et al., PeerJ", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12721101/", "year": 2025},
 "pedersen2022": {"title": "Split-body vs full-body resistance training in non-resistance-trained women (baseline 1RMs)",
                  "org": "Pedersen et al., BMC Sports Sci Med Rehabil", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9107721/", "year": 2022},
 "johnson2009": {"title": "Relationship of lat-pull repetitions and pull-ups to maximal lat-pull and pull-up strength in men and women",
                 "org": "Johnson, Lynch, Nash, Cygan, Mayhew, J Strength Cond Res", "url": "https://pubmed.ncbi.nlm.nih.gov/19387371/", "year": 2009},
 "strengthlevel": {"title": "Strength standards (crowd-sourced, self-reported lifts; practitioner data, low evidence)",
                   "org": "Strength Level", "url": "https://strengthlevel.com/strength-standards", "year": 2026},
 "miller1993": {"title": "Gender differences in strength and muscle fiber characteristics",
                "org": "Miller, MacDougall, Tarnopolsky, Sale, Eur J Appl Physiol", "url": "https://pubmed.ncbi.nlm.nih.gov/8477683/", "year": 1993},
 "janssen2000": {"title": "Skeletal muscle mass and distribution in 468 men and women aged 18-88 yr",
                 "org": "Janssen, Heymsfield, Wang, Ross, J Appl Physiol", "url": "https://pubmed.ncbi.nlm.nih.gov/10904038/", "year": 2000},
 "jaric2002": {"title": "Muscle strength testing: use of normalisation for body size",
               "org": "Jaric, Sports Medicine", "url": "https://doi.org/10.2165/00007256-200232100-00002", "year": 2002},
 "folland2008": {"title": "Allometric scaling of strength measurements to body size",
                 "org": "Folland, McCauley, Williams, Eur J Appl Physiol", "url": "https://pubmed.ncbi.nlm.nih.gov/18172672/", "year": 2008},
 "zoeller2008": {"title": "Allometric scaling of isometric biceps strength in adult females and the effect of body mass index",
                 "org": "Zoeller et al., Eur J Appl Physiol", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4107660/", "year": 2008},
 "tomlinson2016": {"title": "The impact of obesity on skeletal muscle strength and structure through adolescence to old age",
                   "org": "Tomlinson, Erskine, Morse, Winwood, Onambele-Pearson, Biogerontology", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4889641/", "year": 2016},
 "steele2022": {"title": "Are Trainees Lifting Heavy Enough? Self-Selected Loads in Resistance Exercise: A Scoping Review and Exploratory Meta-analysis",
                "org": "Steele et al., Sports Medicine", "url": "https://pubmed.ncbi.nlm.nih.gov/35790622/", "year": 2022},
 "glass2004": {"title": "Self-selected resistance training intensity in novice weightlifters",
               "org": "Glass, Stanton, J Strength Cond Res", "url": "https://journals.lww.com/nsca-jscr/abstract/2004/05000/self_selected_resistance_training_intensity_in.22.aspx", "year": 2004},
 "halperin2022": {"title": "Accuracy in Predicting Repetitions to Task Failure in Resistance Exercise: A Scoping Review and Exploratory Meta-analysis",
                  "org": "Halperin et al., Sports Medicine", "url": "https://pubmed.ncbi.nlm.nih.gov/34542869/", "year": 2022},
 "helms2018": {"title": "RPE vs. Percentage 1RM Loading in Periodized Programs Matched for Sets and Repetitions",
               "org": "Helms et al., Frontiers in Physiology", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5877330/", "year": 2018},
 "greig2020": {"title": "Autoregulation in Resistance Training: Addressing the Inconsistencies",
               "org": "Greig et al., Sports Medicine", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7575491/", "year": 2020},
})

# ---- tr.global.starting_load: conservative first working load from body stats
ANCHORS = ["squat", "bench", "deadlift", "ohp", "lat_pulldown", "row"]
# Estimated 1RM as a fraction of reference mass. Beginner ~ StrengthLevel "Beginner" (5th pct of logged lifters),
# intermediate ~ its "Novice" (20th pct, >= 6 months). Both sit at or below the Cooper 20th-40th pct bench rows and the
# baselines of untrained people in trials, so they aim low on purpose.
RATIO_1RM = {
 "male":   {"beginner":     {"squat": 0.95, "bench": 0.70, "deadlift": 1.10, "ohp": 0.40, "lat_pulldown": 0.55, "row": 0.60},
            "intermediate": {"squat": 1.25, "bench": 0.95, "deadlift": 1.45, "ohp": 0.55, "lat_pulldown": 0.75, "row": 0.80}},
 "female": {"beginner":     {"squat": 0.55, "bench": 0.35, "deadlift": 0.65, "ohp": 0.20, "lat_pulldown": 0.35, "row": 0.30},
            "intermediate": {"squat": 0.80, "bench": 0.50, "deadlift": 0.95, "ohp": 0.33, "lat_pulldown": 0.50, "row": 0.45}},
}
AGE_BANDS = [  # piecewise-linear factor on the 1RM estimate; ratios describe adults up to ~40
 {"from": 18, "to": 40, "factor_at_start": 1.00, "per_year": 0.0},
 {"from": 40, "to": 50, "factor_at_start": 1.00, "per_year": -0.010},
 {"from": 50, "to": 60, "factor_at_start": 0.90, "per_year": -0.015},
 {"from": 60, "to": 75, "factor_at_start": 0.75, "per_year": -0.020},
]
AGE_MAX = 75
FIRST_SESSION_RIR = 4          # effort Easy boundary (tr.global.effort_set_map)
PCT_CAP = {"beginner": 0.60, "intermediate": 0.70, "age_65_plus": 0.50}
SAFETY_MARGIN = 0.9
REF_BMI = 25
PER_HAND_DB = 0.41             # tr.global.swap_starting_load barbell -> dumbbell, per hand
UNILATERAL = 0.4               # tr.global.swap_starting_load bilateral -> unilateral, per side

def m(anchor, factor, basis, **kw): return {"anchor": anchor, "factor": factor, "basis": basis, **kw}
STAPLE_MAP = {
 "Barbell_Squat": m("squat", 1.0, "anchor"),
 "Box_Squat": m("squat", 1.0, "convention: same bar and load path as the back squat"),
 "Barbell_Full_Squat": m("squat", 0.95, "convention: deeper range, a little lighter"),
 "Front_Squat_Clean_Grip": m("squat", 0.80, "convention: front squat ~80% of back squat; no peer-reviewed ratio"),
 "Smith_Machine_Squat": m("squat", 0.95, "tr.global.swap_starting_load (barbell -> Smith, squat)"),
 "Barbell_Deadlift": m("deadlift", 1.0, "anchor"),
 "Sumo_Deadlift": m("deadlift", 1.0, "convention: similar 1RM to conventional"),
 "Trap_Bar_Deadlift": m("deadlift", 1.0, "convention: trap bar 1RM is usually equal or higher; kept at 1.0"),
 "Romanian_Deadlift": m("deadlift", 0.70, "convention: RDL ~70% of deadlift; no peer-reviewed ratio"),
 "Barbell_Bench_Press_-_Medium_Grip": m("bench", 1.0, "anchor"),
 "Barbell_Incline_Bench_Press_-_Medium_Grip": m("bench", 0.80, "convention: incline ~80% of flat; no peer-reviewed ratio"),
 "Close-Grip_Barbell_Bench_Press": m("bench", 0.90, "convention: close grip ~90% of flat"),
 "Smith_Machine_Bench_Press": m("bench", 0.90, "tr.global.swap_starting_load (barbell -> Smith, push_h)"),
 "Dumbbell_Bench_Press": m("bench", PER_HAND_DB, "tr.global.swap_starting_load (barbell -> dumbbell, per hand)"),
 "Incline_Dumbbell_Press": m("bench", round(0.80 * PER_HAND_DB, 3), "incline convention x barbell -> dumbbell per hand"),
 "Standing_Military_Press": m("ohp", 1.0, "anchor"),
 "Dumbbell_Shoulder_Press": m("ohp", PER_HAND_DB, "tr.global.swap_starting_load (barbell -> dumbbell, per hand)"),
 "Seated_Dumbbell_Press": m("ohp", PER_HAND_DB, "tr.global.swap_starting_load (barbell -> dumbbell, per hand)"),
 "Wide-Grip_Lat_Pulldown": m("lat_pulldown", 1.0, "anchor", stack_dependent=True),
 "Close-Grip_Front_Lat_Pulldown": m("lat_pulldown", 1.0, "convention: same stack and pattern", stack_dependent=True),
 "V-Bar_Pulldown": m("lat_pulldown", 1.0, "convention: same stack and pattern", stack_dependent=True),
 "Bent_Over_Barbell_Row": m("row", 1.0, "anchor"),
 "Seated_Cable_Rows": m("row", 1.0, "StrengthLevel cable row ~ barbell row", stack_dependent=True),
 "One-Arm_Dumbbell_Row": m("row", UNILATERAL, "tr.global.swap_starting_load (bilateral -> unilateral, per side)"),
}

def age_factor(age):
    for b in AGE_BANDS:
        if b["from"] <= age < b["to"] or (age == AGE_MAX and b["to"] == AGE_MAX):
            return b["factor_at_start"] + b["per_year"] * (age - b["from"])
    return None

def starting_load(sex, age, bodyweight, height_cm, level, target_reps, staple, step, min_load):
    """Reference implementation. Returns (unrounded, suggested, outcome)."""
    ratios = RATIO_1RM["female" if sex not in ("male", "female") else sex][level]
    ref = min(bodyweight, REF_BMI * (height_cm / 100) ** 2) if height_cm else bodyweight
    mp = STAPLE_MAP[staple]
    e1rm = ref * ratios[mp["anchor"]] * age_factor(age) * mp["factor"]
    pct = min(1 / (1 + (target_reps + FIRST_SESSION_RIR) / 30), PCT_CAP["age_65_plus" if age >= 65 else level])
    raw = e1rm * pct * SAFETY_MARGIN
    rounded = (raw + 1e-9) // step * step
    if rounded >= min_load: return round(raw, 1), rounded, "estimate"
    if min_load <= PCT_CAP["intermediate"] * e1rm: return round(raw, 1), min_load, "lightest_load"
    return round(raw, 1), None, "suggest_lighter_kit_or_calibrate"

KIT = {"barbell": (2.5, 20.0), "dumbbell": (2.0, 2.0), "stack": (5.0, 5.0)}
EX_LIFTS = [("Barbell_Squat", "barbell"), ("Barbell_Bench_Press_-_Medium_Grip", "barbell"), ("Barbell_Deadlift", "barbell"),
            ("Standing_Military_Press", "barbell"), ("Wide-Grip_Lat_Pulldown", "stack"), ("Dumbbell_Bench_Press", "dumbbell")]
EX_PEOPLE = [
 {"name": "35-year-old beginner man, 92 kg, 180 cm, 10 reps", "sex": "male", "age": 35, "bodyweight": 92, "height_cm": 180, "level": "beginner", "target_reps": 10},
 {"name": "Same man without a height (no reference-mass cap)", "sex": "male", "age": 35, "bodyweight": 92, "height_cm": None, "level": "beginner", "target_reps": 10},
 {"name": "55-year-old intermediate woman, 65 kg, 165 cm, 10 reps", "sex": "female", "age": 55, "bodyweight": 65, "height_cm": 165, "level": "intermediate", "target_reps": 10},
 {"name": "68-year-old beginner, sex not given, 80 kg, 172 cm, 12 reps", "sex": "prefer_not_to_say", "age": 68, "bodyweight": 80, "height_cm": 172, "level": "beginner", "target_reps": 12},
]
EXAMPLES = []
for p in EX_PEOPLE:
    rows = {}
    for sid, kit in EX_LIFTS:
        raw, load, outcome = starting_load(p["sex"], p["age"], p["bodyweight"], p["height_cm"], p["level"], p["target_reps"], sid, *KIT[kit])
        rows[sid] = {"unrounded_kg": raw, "suggested_kg": load, "outcome": outcome, "kit_step_kg": KIT[kit][0], "lightest_kg": KIT[kit][1]}
    EXAMPLES.append({"input": p, "expected": rows})

CALIBRATE_REASONS = {
 "machine": "machine: stack or lever ratios differ between makers (leg press norms don't transfer, Brown 1998)",
 "cable": "cable: stack and pulley ratios differ between gyms",
 "kettlebell": "no reliable ratio to a barbell anchor",
 "dumbbell": "no reliable ratio to a barbell anchor for this movement",
 "barbell": "no reliable ratio to an anchor lift (isolation, lunge, bridge or thrust)",
 "ez_bar": "isolation: no reliable ratio to an anchor lift",
 "other": "no reliable ratio to an anchor lift",
}
_ex = json.load(open("data/exercises.json"))["exercises"]
LOADED = [e for e in _ex if e["staple"] and e["load_convention"] in ("total", "per_hand", "per_side") and e["movement_pattern"] != "cardio"]
CALIBRATE = {e["id"]: CALIBRATE_REASONS[e["equipment"][0]] for e in LOADED if e["id"] not in STAPLE_MAP}

STARTING_LOAD = {"rule": "starting_load", "value": {
  "formula": "starting working load = reference_mass x ratio_1rm[sex][level][anchor] x age_factor(age) x staple_factor "
             "x first_session_pct x safety_margin, then round DOWN to the kit step",
  "inputs": {
   "sex": {"enum": ["male", "female", "prefer_not_to_say"], "prefer_not_to_say": "use the female ratios (the lower of the two)"},
   "age": {"unit": "years", "applies": [18, AGE_MAX], "outside": "calibrate_instead"},
   "bodyweight": {"unit": "kg"},
   "height": {"unit": "cm", "optional": True, "used_for": "reference_mass only"},
   "level": {"enum": ["beginner", "intermediate"], "matches": "tr.goal.* weekly_sets_per_muscle levels",
             "definition": {"beginner": "under ~6 months of regular lifting", "intermediate": "~6 months to 2 years"}},
   "target_reps": {"from": "the plan's target reps for that exercise (normally the bottom of the goal's rep range)"}},
  "reference_mass": {"expression": "min(bodyweight, 25 x height_m^2)", "without_height": "bodyweight",
                     "why": "strength follows lean mass; weight above a BMI of 25 adds little strength, so capping it avoids overestimating"},
  "ratio_1rm": RATIO_1RM,
  "ratio_note": "Estimated 1RM divided by reference mass, for the anchor lift. Beginner rows sit near the 5th percentile of logged lifters "
                "and intermediate rows near the 20th, both at or below population and untrained-trial data, so they aim low.",
  "age_factor": {"bands": AGE_BANDS, "method": "factor_at_start + per_year x (age - from)", "at_75": round(age_factor(75), 3)},
  "first_session_pct": {"expression": "min(1 / (1 + (target_reps + 4) / 30), cap)",
                        "why": "inverse of the Epley formula (tr.global.e1rm) at 4 reps in reserve, i.e. effort Easy",
                        "cap": PCT_CAP, "cap_rule": "age >= 65 uses age_65_plus; otherwise the level's cap"},
  "safety_margin": SAFETY_MARGIN,
  "rounding": "round DOWN to the user's kit step (barbell: smallest plate pair; dumbbells: the next rack weight down; stack: the next pin down)",
  "below_lightest_load": {"rule": "if the rounded load is below the lightest option (e.g. the empty bar), use the lightest option "
                                  "only if it is <= 70% of the estimated 1RM; otherwise suggest a lighter-kit swap from `swaps` or calibrate",
                          "outcomes": ["estimate", "lightest_load", "suggest_lighter_kit_or_calibrate"]},
  "load_convention": "per_hand staples carry the per-hand conversion in their factor (e.g. 0.41); the result is the weight of each dumbbell. "
                     "Anchor-lift loads are total loads (bar included).",
  "anchors": ANCHORS,
  "staples": STAPLE_MAP,
  "stack_dependent": "pulldown and cable-row estimates depend on the machine's stack and pulleys. Show them as a rough guide and expect set 1 to correct them.",
  "calibrate_instead": {"staples": CALIBRATE,
                        "also": ["bodyweight, bodyweight_plus and assisted exercises", "cardio", "any exercise not in `staples`",
                                 "age outside 18-75", "missing bodyweight or level",
                                 "frailty_falls or medical_clearance_first without clearance (safety_rules.json)"],
                        "method": "tr.global.swap_starting_load -> calibrate_instead"},
  "first_session": {"target_effort": "Easy or OK on every set (RPE <= 7); never Hard",
                    "after_set_1": {"easy": "raise 5-10% (one or two kit steps) for the next set", "ok": "keep the load",
                                    "hard": "drop 10% and keep it there", "pain": "safety rules first (pain_during_exercise)"},
                    "max_changes": "adjust at most twice in the first session; from session 2 the normal progression rule takes over from the logged load",
                    "label": "Starting weight: an estimate from your body stats. Change it freely."},
  "screening": "Screening results with max_rpe (sf.screening) still apply; the first session target is already below them.",
  "user_editable": True,
  "worked_examples": EXAMPLES,
  "worked_examples_kit": {k: {"step_kg": v[0], "lightest_kg": v[1]} for k, v in KIT.items()}},
 "detail": "Review conclusions. (1) Bodyweight predicts strength, but not in proportion: fat mass adds little, and fat-free mass is the best scaler "
           "(Jaric 2002; Folland 2008; Zoeller 2008; Tomlinson 2016: people with obesity are about a third weaker per kg on leg tests). "
           "Height adds nothing on its own once lean mass is known, but here it lets us cap bodyweight at a BMI of 25, which is our synthesis, "
           "not a tested method. (2) Women have roughly 50-60% of men's upper-body and 65-70% of lower-body strength (Miller 1993; Janssen 2000: "
           "40% less upper-body and 33% less lower-body muscle), so ratios are by sex. (3) Strength changes little to about 40-50, then falls about "
           "1-1.5% a year in the 50s and 2-3% a year after 60 (Keller 2013; Fragala 2019: 0.8-3.6% a year; Goodpaster 2006: 2.6-4.1% a year in "
           "the 70s). Our age bands sit in the middle of those ranges. (4) Novices may start at 50-60% of 1RM or less (ACSM 2009); older adults "
           "start at a tolerated load, around 40-55% (Fragala 2019). (5) No peer-reviewed norms cover free-weight squat, deadlift, press and "
           "row by sex and level. The ratios lean on crowd-sourced standards (low evidence), checked against Cooper bench norms and "
           "untrained-trial baselines (Ma 2025; Pedersen 2022; Johnson 2009 for pulldown). A 1RM estimate in a novice is unstable (Helms 2016), "
           "so the result is a first guess that set 1 corrects.",
 "engine_default": True,
 "sources": s("acsm2009", "fragala2019", "keller2013", "goodpaster2006", "miller1993", "janssen2000", "jaric2002", "folland2008",
              "zoeller2008", "tomlinson2016", "cooper_bench", "brown1998", "ma2025", "pedersen2022", "johnson2009", "strengthlevel",
              "helms2016", "epley1985"),
 "evidence_strength": "weak", "licence": LIC}

# ---- pr.personal_adjustment: bounds for learning the user's style
PERSONAL_ADJUSTMENT = {
 "rule": "Suggestions may shift towards how the user actually lifts, per exercise, but only within tight bounds. The rules engine and safety rules stay in charge.",
 "value": {
  "load_bias": {
   "signal": "per exercise: lifted working load / suggested working load - 1, on working sets only (never warm-ups or deload sets)",
   "min_sessions": 4, "window_sessions": 6,
   "min_consistent_share": 0.75,
   "min_median_gap_pct": 5,
   "max_total_pct": {"up": 10, "down": 10},
   "max_step_pct_per_week": 5,
   "applies_up_only_if": "the heavier sets were logged Easy or OK with the target reps done, and there were no pain flags for the exercise's body areas in the window",
   "applies_down_only_if": "the suggested load was logged Hard or reps fell short on it; lifting lighter while logging Easy does NOT lower suggestions"},
  "pace": {
   "signal": "share of suggested load increases the user declined or undid",
   "slower": "if 2 of the last 3 suggested increases were declined, require one extra qualifying session before the next increase (max +1 session)",
   "faster": "if every increase in the window was accepted and the next sets were logged Easy, use the top of the rule's increment range; never a bigger step",
   "min_sessions": 4},
  "never": ["outside the goal's allowed_rep_range or allowed ranges (tr.goal.*)",
            "above the rule's increment range (pr.* methods)",
            "above a screening max_rpe (sf.screening)",
            "on an exercise or body area with an open pain flag or safety action",
            "during a deload (pr.deload) or the new-user ramp (pr.new_user_ramp)",
            "to change any safety rule or message"],
  "reset_on": ["pain flag for the exercise's body areas", "swap to a different exercise", "a break of 3+ weeks", "the user taps reset"],
  "visibility": {"label": "Adjusted to how you usually lift", "show": "the size of the adjustment and the rule it adjusts", "resettable": True}},
 "detail": "Evidence is thin; these bounds are our synthesis. Why they are tight: 1RM varies about 4-5.5% between sessions (Grgic 2020), so a "
           "smaller gap is noise, and several sessions are needed before a trend means anything (no source gives a number; 4 is our default). "
           "RPE-based systems move load about 2% per half RPE point, about 8% at the extremes (Helms 2018), and ACSM 2009 uses 2-10% steps, so "
           "a 10% ceiling and 5% steps stay inside normal practice. People choose loads below what builds strength, about 53% of 1RM on "
           "average (Steele 2022; Glass 2004), and misjudge reps in reserve by about 1 rep (Halperin 2022), so a habit of lifting lighter never "
           "pulls suggestions down on its own. Autoregulated programmes do as well as or better than fixed ones (Greig 2020), which supports "
           "bounded personal adjustment.",
 "engine_default": True,
 "sources": s("grgic2020", "helms2018", "acsm2009", "steele2022", "glass2004", "halperin2022", "greig2020"),
 "evidence_strength": "weak", "licence": LIC}

training["global"].append(STARTING_LOAD)
NEW_GLOBAL_IDS["starting_load"] = "tr.global.starting_load"
progression["personal_adjustment"] = PERSONAL_ADJUSTMENT
training["notes"].append("v0.1.3: tr.global.starting_load estimates a conservative first working load from body stats; pr.personal_adjustment bounds learning the user's style.")

# ---------------------------------------------------------------- stable ids (v0.1.1)
def with_id(d, id_):
    assert "id" not in d or d["id"] == id_
    return {"id": id_, **{k: v for k, v in d.items() if k != "id"}}

GLOBAL_IDS = {"min_frequency_per_muscle_per_week": "tr.global.min_frequency", "set_counting": "tr.global.set_counting",
              "exercise_order": "tr.global.exercise_order", "full_range_of_motion": "tr.global.full_rom",
              "rpe_rir_map": "tr.global.rpe_rir_map", **NEW_GLOBAL_IDS}
training["global"] = [with_id(r, GLOBAL_IDS[r["rule"]]) for r in training["global"]]
training["goals"] = [with_id(g, f"tr.goal.{g['goal']}") for g in training["goals"]]
for g in training["goals"]:
    if "inherits" in g: g["inherits"] = f"tr.goal.{g['inherits']}"
training["minimum_doses"] = [with_id(r, f"tr.dose.{r['rule']}") for r in training["minimum_doses"]]
training["conflicts"] = [with_id(c, f"tr.conflict.{c['topic']}") for c in training["conflicts"]]

progression["methods"] = [with_id(m, f"pr.{m['method']}") for m in progression["methods"]]
for k in ("volume_progression", "stall", "deload", "new_user_ramp", "personal_adjustment"):
    progression[k] = with_id(progression[k], f"pr.{k}")
progression["stall"]["steps"] = [with_id(st, f"pr.stall.step{st['step']}") for st in progression["stall"]["steps"]]

safety["screening"] = with_id(safety["screening"], "sf.screening")
# screening question ids stay bare (matrix keys reference them); cite as sf.screening + question id

ID_SCHEME = ("id_scheme: every rule has a permanent `id`. IDs never change or get reused between versions; a retired rule "
             "keeps its id with `retired: true`. Prefixes: tr.* = training_rules, pr.* = progression_rules, sf.* = screening "
             "(questions cited as sf.screening.<question id>); "
             "safety red-flag rules keep their bare snake_case ids from v0.1.0. AI suggestions must cite ids, e.g. 'pr.stall.step2'.")
for f in (training, progression, safety):
    f["version"] = "0.1.3"
    f["notes"].insert(0, ID_SCHEME)

ALL_IDS = ([r["id"] for r in training["global"] + training["goals"] + training["minimum_doses"] + training["conflicts"]]
           + [m["id"] for m in progression["methods"]]
           + [progression[k]["id"] for k in ("volume_progression", "stall", "deload", "new_user_ramp", "personal_adjustment")]
           + [st["id"] for st in progression["stall"]["steps"]]
           + [r["id"] for r in safety["rules"]] + [safety["screening"]["id"]] + [f"sf.screening.{q['id']}" for q in safety["screening"]["questions"]] + ["sf.screening.cleared_by_gp"])
assert len(ALL_IDS) == len(set(ALL_IDS))
json.dump(sorted(ALL_IDS), open("data/rule_ids.json", "w"), indent=1)
# v0.1.2 asserts
assert all("message" in v for v in safety["screening"]["matrix"].values()), "screening result without message"
assert set(safety["screening"]["result_messages"]) >= {v["result"] for v in safety["screening"]["matrix"].values()}
assert all(set(r["services"]) <= set(SERVICES) for r in safety["rules"])
for rr in training["global"] + training["goals"] + training["minimum_doses"] + progression["methods"] + safety["rules"] + \
          [progression[k] for k in ("volume_progression", "stall", "deload", "new_user_ramp", "personal_adjustment")]:
    assert rr["id"] and rr["sources"] and rr["evidence_strength"] and rr["licence"], rr.get("id")
# v0.1.3 asserts: starting loads
sl = next(r for r in training["global"] if r["id"] == "tr.global.starting_load")["value"]
assert set(STAPLE_MAP) <= {e["id"] for e in LOADED}, set(STAPLE_MAP) - {e["id"] for e in LOADED}
assert set(STAPLE_MAP).isdisjoint(CALIBRATE) and set(STAPLE_MAP) | set(CALIBRATE) == {e["id"] for e in LOADED}, "loaded staple not mapped or calibrated"
assert all(v["anchor"] in ANCHORS and 0 < v["factor"] <= 1 for v in STAPLE_MAP.values())
_conv = {e["id"]: e["load_convention"] for e in LOADED}
assert all((v["factor"] <= 0.5) == (_conv[k] == "per_hand") for k, v in STAPLE_MAP.items()), "per_hand staples need a per-hand factor"
for lv in ("beginner", "intermediate"):
    assert all(RATIO_1RM["female"][lv][a] < RATIO_1RM["male"][lv][a] for a in ANCHORS)
for sx in RATIO_1RM:
    assert all(RATIO_1RM[sx]["beginner"][a] < RATIO_1RM[sx]["intermediate"][a] for a in ANCHORS)
_ages = [age_factor(a) for a in range(18, AGE_MAX + 1)]
assert all(x >= y for x, y in zip(_ages, _ages[1:])) and _ages[0] == 1.0 and _ages[-1] > 0, "age factor must not rise"
assert all(abs(age_factor(b["to"] - 1e-9) - nb["factor_at_start"]) < 1e-6 for b, nb in zip(AGE_BANDS, AGE_BANDS[1:])), "age bands must join up"
EXPECTED = {  # (person index, staple): suggested kg. Recomputed above; pinned here so a change is deliberate.
 (0, "Barbell_Squat"): 40.0, (0, "Barbell_Bench_Press_-_Medium_Grip"): 30.0, (0, "Barbell_Deadlift"): 47.5, (0, "Standing_Military_Press"): 20.0, (0, "Wide-Grip_Lat_Pulldown"): 20.0, (0, "Dumbbell_Bench_Press"): 12.0,
 (1, "Barbell_Squat"): 45.0, (1, "Barbell_Bench_Press_-_Medium_Grip"): 32.5, (1, "Barbell_Deadlift"): 52.5, (1, "Standing_Military_Press"): 20.0, (1, "Wide-Grip_Lat_Pulldown"): 25.0, (1, "Dumbbell_Bench_Press"): 14.0,
 (2, "Barbell_Squat"): 25.0, (2, "Barbell_Bench_Press_-_Medium_Grip"): None, (2, "Barbell_Deadlift"): 30.0, (2, "Standing_Military_Press"): None, (2, "Wide-Grip_Lat_Pulldown"): 15.0, (2, "Dumbbell_Bench_Press"): 6.0,
 (3, "Barbell_Squat"): None, (3, "Barbell_Bench_Press_-_Medium_Grip"): None, (3, "Barbell_Deadlift"): None, (3, "Standing_Military_Press"): None, (3, "Wide-Grip_Lat_Pulldown"): 5.0, (3, "Dumbbell_Bench_Press"): 2.0,
}
for (i, sid), kg in EXPECTED.items():
    assert sl["worked_examples"][i]["expected"][sid]["suggested_kg"] == kg, (i, sid, sl["worked_examples"][i]["expected"][sid])
assert all(r["suggested_kg"] is None or r["suggested_kg"] <= r["unrounded_kg"] or r["outcome"] == "lightest_load"
           for ex in sl["worked_examples"] for r in ex["expected"].values()), "must round down"
pa = progression["personal_adjustment"]["value"]
assert pa["load_bias"]["max_total_pct"]["up"] <= 10 and pa["load_bias"]["max_step_pct_per_week"] <= pa["load_bias"]["max_total_pct"]["up"]
print("rule ids:", len(ALL_IDS))

VERIFY = {  # how each source was checked during research (v0.1.1)
 "full_text": ["acsm2026", "acsm2009", "grgic2018", "helms2016", "singer2024", "pelland2026", "bell2023", "schoenfeld2021",
               "who2020", "cmo2019", "hprc", "nhs_chest", "nhs_angina", "nhs_999", "nhs_sprain", "nhs_periods", "bhf_safe",
               "cddft", "cc_doms", "cc_sick", "parq",
               "nhs_back_ex", "nhs_physio", "nhs_msk", "nhs_gp", "nhs_111", "nhs_111_wales", "nhs24", "ni_ooh", "reynolds2006",
               "cotterman2005", "kolber2014", "ribeiro2020", "day2004", "haddad2017", "martinfuentes2020",
               "keller2013", "fragala2019", "grgic2020", "cooper_bench", "ma2025", "pedersen2022", "strengthlevel", "zoeller2008",
               "tomlinson2016", "helms2018", "greig2020"],
 "abstract_only": ["coleman2024", "spiering2021", "lesuer1997", "saeterbakken2011", "ribeiro2014",
                   "goodpaster2006", "brown1998", "johnson2009", "miller1993", "janssen2000", "jaric2002", "folland2008", "steele2022", "halperin2022"],
 "secondary_only": ["nsca", "schoenfeld2017", "robinson2024", "refalo2024", "ak2020", "bell2024", "ioc_reds", "riebe2015", "silbernagel2007", "epley1985", "foster2001", "csp_find",
                    "glass2004"],
}
assert sorted(sum(VERIFY.values(), [])) == sorted(SRC), set(SRC) ^ set(sum(VERIFY.values(), []))
SRC_OUT = {k: {**v, "verification": next(st for st, ks in VERIFY.items() if k in ks)} for k, v in SRC.items()}
registry = {"version": "0.1.3",
            "notes": ["verification: full_text = figures checked against the paper/page; abstract_only = abstract or publisher summary; "
                      "secondary_only = figures from reviews/summaries citing it (paywall or rate-limited). Spot-check secondary_only before launch."],
            "sources": SRC_OUT}

for name, obj in [("training_rules", training), ("progression_rules", progression), ("safety_rules", safety), ("sources", registry)]:
    json.dump(obj, open(f"data/{name}.json", "w"), indent=1, ensure_ascii=False)
print("ok")
