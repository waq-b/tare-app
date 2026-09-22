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

# ---------------------------------------------------------------- stable ids (v0.1.1)
def with_id(d, id_):
    assert "id" not in d or d["id"] == id_
    return {"id": id_, **{k: v for k, v in d.items() if k != "id"}}

GLOBAL_IDS = {"min_frequency_per_muscle_per_week": "tr.global.min_frequency", "set_counting": "tr.global.set_counting",
              "exercise_order": "tr.global.exercise_order", "full_range_of_motion": "tr.global.full_rom",
              "rpe_rir_map": "tr.global.rpe_rir_map"}
training["global"] = [with_id(r, GLOBAL_IDS[r["rule"]]) for r in training["global"]]
training["goals"] = [with_id(g, f"tr.goal.{g['goal']}") for g in training["goals"]]
for g in training["goals"]:
    if "inherits" in g: g["inherits"] = f"tr.goal.{g['inherits']}"
training["minimum_doses"] = [with_id(r, f"tr.dose.{r['rule']}") for r in training["minimum_doses"]]
training["conflicts"] = [with_id(c, f"tr.conflict.{c['topic']}") for c in training["conflicts"]]

progression["methods"] = [with_id(m, f"pr.{m['method']}") for m in progression["methods"]]
for k in ("volume_progression", "stall", "deload", "new_user_ramp"):
    progression[k] = with_id(progression[k], f"pr.{k}")
progression["stall"]["steps"] = [with_id(st, f"pr.stall.step{st['step']}") for st in progression["stall"]["steps"]]

safety["screening"] = with_id(safety["screening"], "sf.screening")
# screening question ids stay bare (matrix keys reference them); cite as sf.screening + question id

ID_SCHEME = ("id_scheme: every rule has a permanent `id`. IDs never change or get reused between versions; a retired rule "
             "keeps its id with `retired: true`. Prefixes: tr.* = training_rules, pr.* = progression_rules, sf.* = screening "
             "(questions cited as sf.screening.<question id>); "
             "safety red-flag rules keep their bare snake_case ids from v0.1.0. AI suggestions must cite ids, e.g. 'pr.stall.step2'.")
for f in (training, progression, safety):
    f["version"] = "0.1.1"
    f["notes"].insert(0, ID_SCHEME)

ALL_IDS = ([r["id"] for r in training["global"] + training["goals"] + training["minimum_doses"] + training["conflicts"]]
           + [m["id"] for m in progression["methods"]]
           + [progression[k]["id"] for k in ("volume_progression", "stall", "deload", "new_user_ramp")]
           + [st["id"] for st in progression["stall"]["steps"]]
           + [r["id"] for r in safety["rules"]] + [safety["screening"]["id"]] + [f"sf.screening.{q['id']}" for q in safety["screening"]["questions"]])
assert len(ALL_IDS) == len(set(ALL_IDS))
json.dump(sorted(ALL_IDS), open("data/rule_ids.json", "w"), indent=1)
print("rule ids:", len(ALL_IDS))

VERIFY = {  # how each source was checked during research (v0.1.1)
 "full_text": ["acsm2026", "acsm2009", "grgic2018", "helms2016", "singer2024", "pelland2026", "bell2023", "schoenfeld2021",
               "who2020", "cmo2019", "hprc", "nhs_chest", "nhs_angina", "nhs_999", "nhs_sprain", "nhs_periods", "bhf_safe",
               "cddft", "cc_doms", "cc_sick", "parq"],
 "abstract_only": ["coleman2024", "spiering2021"],
 "secondary_only": ["nsca", "schoenfeld2017", "robinson2024", "refalo2024", "ak2020", "bell2024", "ioc_reds", "riebe2015"],
}
assert sorted(sum(VERIFY.values(), [])) == sorted(SRC), set(SRC) ^ set(sum(VERIFY.values(), []))
SRC_OUT = {k: {**v, "verification": next(st for st, ks in VERIFY.items() if k in ks)} for k, v in SRC.items()}
registry = {"version": "0.1.1",
            "notes": ["verification: full_text = figures checked against the paper/page; abstract_only = abstract or publisher summary; "
                      "secondary_only = figures from reviews/summaries citing it (paywall or rate-limited). Spot-check secondary_only before launch."],
            "sources": SRC_OUT}

for name, obj in [("training_rules", training), ("progression_rules", progression), ("safety_rules", safety), ("sources", registry)]:
    json.dump(obj, open(f"data/{name}.json", "w"), indent=1, ensure_ascii=False)
print("ok")
