"""Build data/exercises.json (contract shape) from free-exercise-db (Unlicense).

v0.1.1: staples (111) get hand-curated swaps + cues from staples.py.
v0.1.3: version bump only (no exercise changes).
v0.1.2: display names, body areas, kit detail, skill tags, trimmed muscles, stabilisers.
Everything else: heuristic movement pattern + ranked swaps, flagged in `derived`.
"""
import json, re, collections
from staples import SWAPS as HAND_SWAPS, CUES, META, PATTERN_FIX, LOAD_FIX, MUSCLE_FIX

RAW = json.load(open("raw/exercises_raw.json"))

STAPLES = {
 # squat
 "Barbell_Squat","Barbell_Full_Squat","Front_Squat_Clean_Grip","Goblet_Squat","Leg_Press","Hack_Squat",
 "Smith_Machine_Squat","Bodyweight_Squat","Dumbbell_Squat","Box_Squat",
 # hinge
 "Barbell_Deadlift","Romanian_Deadlift","Trap_Bar_Deadlift","Stiff-Legged_Dumbbell_Deadlift","Barbell_Hip_Thrust",
 "Barbell_Glute_Bridge","Single_Leg_Glute_Bridge","Hyperextensions_Back_Extensions","Good_Morning","One-Arm_Kettlebell_Swings",
 "Sumo_Deadlift","Pull_Through","Kettlebell_One-Legged_Deadlift",
 # lunge
 "Dumbbell_Lunges","Barbell_Walking_Lunge","Bodyweight_Walking_Lunge","Split_Squat_with_Dumbbells","Dumbbell_Step_Ups",
 "Dumbbell_Rear_Lunge","Barbell_Lunge",
 # push_h
 "Barbell_Bench_Press_-_Medium_Grip","Dumbbell_Bench_Press","Incline_Dumbbell_Press","Barbell_Incline_Bench_Press_-_Medium_Grip",
 "Pushups","Incline_Push-Up","Machine_Bench_Press","Cable_Crossover","Dumbbell_Flyes","Dips_-_Chest_Version",
 "Close-Grip_Barbell_Bench_Press","Leverage_Chest_Press","Butterfly","Smith_Machine_Bench_Press",
 # push_v
 "Standing_Military_Press","Dumbbell_Shoulder_Press","Seated_Dumbbell_Press","Machine_Shoulder_Military_Press",
 "Arnold_Dumbbell_Press","Landmine_Linear_Jammer",
 # pull_v
 "Pullups","Chin-Up","Wide-Grip_Lat_Pulldown","Close-Grip_Front_Lat_Pulldown","Band_Assisted_Pull-Up","V-Bar_Pulldown",
 "Straight-Arm_Pulldown",
 # pull_h
 "Bent_Over_Barbell_Row","One-Arm_Dumbbell_Row","Seated_Cable_Rows","T-Bar_Row_with_Handle","Inverted_Row",
 "Leverage_Iso_Row","Dumbbell_Incline_Row","Face_Pull",
 # arms/shoulders iso
 "Side_Lateral_Raise","Cable_Seated_Lateral_Raise","Reverse_Flyes","Cable_Rear_Delt_Fly","Barbell_Curl","Dumbbell_Bicep_Curl",
 "Hammer_Curls","Incline_Dumbbell_Curl","Preacher_Curl","EZ-Bar_Curl","Triceps_Pushdown","Triceps_Pushdown_-_Rope_Attachment",
 "Triceps_Overhead_Extension_with_Rope","EZ-Bar_Skullcrusher","Dips_-_Triceps_Version","Barbell_Shrug","Dumbbell_Shrug",
 # legs iso
 "Leg_Extensions","Lying_Leg_Curls","Seated_Leg_Curl","Standing_Calf_Raises","Seated_Calf_Raise","Thigh_Abductor","Thigh_Adductor",
 "Glute_Ham_Raise",
 # core
 "Plank","Side_Bridge","Dead_Bug","Pallof_Press","Cable_Crunch","Hanging_Leg_Raise","Ab_Roller","Russian_Twist","Reverse_Crunch",
 "Crunches",
 # carry / cardio
 "Farmers_Walk","Walking_Treadmill","Running_Treadmill","Bicycling_Stationary","Rowing_Stationary","Elliptical_Trainer",
 "Stairmaster","Rope_Jumping","Recumbent_Bike","Battling_Ropes","Air_Bike",
}

def has(name, *words):
    """Keyword match on word boundaries (v0.1.2: 'machine' no longer matches 'chin')."""
    n = name.lower()
    return any(re.search(r"(?<![a-z])" + re.escape(w), n) for w in words)

def pattern(x):
    n, cat = x["name"], x["category"]
    prim = set(x["primaryMuscles"])
    if cat == "stretching": return "mobility"
    if cat == "cardio" or has(n, "treadmill", "bicycling", "elliptical", "stairmaster", "step mill", "rowing, stationary",
                              "rowing stationary", "rope jumping", "sprint", "battling ropes", "skating", "trail running"):
        return "cardio"
    if cat == "plyometrics": return "plyometric"
    if cat == "olympic weightlifting" or has(n, "clean", "snatch", "jerk"): return "olympic"
    if has(n, "carry", "farmer", "yoke", "suitcase", "walk") and not has(n, "lunge"): return "carry"
    if has(n, "lunge", "split squat", "step-up", "step up", "step ups", "bulgarian"): return "lunge"
    if has(n, "side bridge", "plank"): return "core"
    if has(n, "deadlift", "romanian", "good morning", "hip thrust", "glute bridge", "hip raise", "bridge", "swing",
           "hyperextension", "pull through", "rack pull", "glute ham", "glute-ham", "kickback", "hip extension", "hip lift"):
        return "hinge"
    if has(n, "squat", "leg press", "hack", "thruster"): return "squat"
    if prim & {"abdominals"} or has(n, "plank", "crunch", "sit-up", "pallof", "wood chop", "russian twist", "rollout", "ab roller"):
        return "core"
    if has(n, "pull-up", "pullup", "pull up", "chin", "pulldown", "pull-down", "muscle up", "rope climb", "pullover"):
        return "pull_v"
    if has(n, "row", "face pull", "rear delt", "reverse fly", "reverse flye", "pull apart", "back fly", "back flye"):
        return "pull_h"
    if has(n, "curl") and not has(n, "leg curl", "wrist", "hamstring"): return "isolation"
    if has(n, "military", "shoulder press", "overhead press", "push press", "arnold", "jammer", "bradford", "behind neck",
           "dumbbell press", "kettlebell press", "seated press") and "chest" not in prim:
        return "push_v"
    if (has(n, "bench", "push-up", "pushup", "push up", "chest press", "floor press", "dip", "fly", "flye", "crossover",
           "butterfly", "decline press", "incline press", "svend") or ("chest" in prim and has(n, "press"))) and not has(n, "triceps extension", "tricep extension"):
        return "push_h"
    return "isolation"

def equipment(x):
    e = x.get("equipment")
    if e is None: return ["bodyweight"]  # v0.1.1: "none" merged into bodyweight
    return {"body only": ["bodyweight"], "e-z curl bar": ["ez_bar"], "kettlebells": ["kettlebell"],
            "medicine ball": ["medicine_ball"], "exercise ball": ["exercise_ball"], "foam roll": ["foam_roller"]
            }.get(e, [e.replace(" ", "_")])


LEVEL = {"beginner": "beginner", "intermediate": "intermediate", "expert": "advanced"}
LEVEL_RANK = {"beginner": 0, "intermediate": 1, "advanced": 2}
MUSCLES = ["abdominals", "abductors", "adductors", "biceps", "calves", "chest", "forearms", "glutes", "hamstrings",
           "lats", "lower back", "middle back", "neck", "quadriceps", "shoulders", "traps", "triceps"]
EQUIPMENT = ["barbell", "dumbbell", "kettlebell", "ez_bar", "cable", "machine", "bands", "bodyweight",
             "medicine_ball", "exercise_ball", "foam_roller", "other"]
EQ_CLASS = {"barbell": "barbell", "ez_bar": "barbell", "dumbbell": "free_weight", "kettlebell": "free_weight",
            "cable": "machine", "machine": "machine", "bodyweight": "bodyweight", "bands": "bands",
            "medicine_ball": "other", "exercise_ball": "other", "foam_roller": "other", "other": "other"}
LOAD_TIER = {"barbell": 3, "machine": 2, "free_weight": 2, "other": 1, "bands": 1, "bodyweight": 0}
LEG_MUSCLES = {"quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors"}
REASON = {"d": "same_pattern_diff_kit", "e": "easier_regression", "h": "harder_progression", "m": "same_muscle"}

def unilateral(n):
    return has(n, "one-arm", "one arm", "single-arm", "single arm", "one-leg", "one leg", "single-leg", "single leg",
               "alternat", "lunge", "split squat", "step-up", "step up", "pistol")

def load_convention(e):
    n, eq, pat = e["name"].lower(), e["equipment"][0], e["movement_pattern"]
    if pat in ("cardio", "mobility"): return "bodyweight"
    if "assisted" in n: return "assisted"
    if "weighted" in n and has(n, "pull", "chin", "dip", "push-up", "pushup"): return "bodyweight_plus"
    if eq == "bodyweight": return "bodyweight"
    if eq == "dumbbell":
        return "total" if has(n, "goblet", "pullover", "plie", "calf raise on a dumbbell") else "per_hand"
    if eq == "kettlebell":
        return "per_hand" if has(n, "double", "two kettlebells", "two-arm kettlebell") else "total"
    if eq == "machine" and "leverage" in n: return "per_side"   # plate-loaded
    if eq in ("exercise_ball", "foam_roller"): return "bodyweight"
    return "total"

def increment_class(e):
    if e["movement_pattern"] in ("squat", "hinge", "lunge"): return "lower"
    return "lower" if set(e["primary_muscles"]) & LEG_MUSCLES else "upper"

PATTERN_FIX_ALL = {**PATTERN_FIX, "Reverse_Machine_Flyes": "pull_h"}
BODY_AREAS = ["neck", "shoulder", "elbow", "wrist", "upper_back", "lower_back", "hip", "knee", "ankle", "calf"]
SIDED = ["shoulder", "elbow", "wrist", "hip", "knee", "ankle", "calf"]
MUSCLE_AREA = {"biceps": "elbow", "triceps": "elbow", "shoulders": "shoulder", "chest": "shoulder", "traps": "neck",
               "forearms": "wrist", "quadriceps": "knee", "hamstrings": "knee", "calves": "calf", "glutes": "hip",
               "abductors": "hip", "adductors": "hip", "lats": "shoulder", "middle back": "upper_back",
               "lower back": "lower_back", "neck": "neck", "abdominals": "lower_back"}
PATTERN_AREAS = {"squat": ("knee hip", "lower_back ankle"), "hinge": ("lower_back hip", "knee"), "lunge": ("knee hip", "ankle"),
                 "push_h": ("shoulder elbow", "wrist"), "push_v": ("shoulder elbow", "wrist"), "pull_v": ("shoulder elbow", "wrist"),
                 "pull_h": ("upper_back shoulder", "elbow"), "carry": ("wrist shoulder lower_back", "knee hip"),
                 "core": ("lower_back", "hip"), "cardio": ("knee", "hip ankle"), "plyometric": ("knee ankle", "hip calf"),
                 "olympic": ("shoulder wrist lower_back hip knee", "elbow ankle")}
EQUIPMENT_DETAIL = ["barbell", "ez_bar", "trap_bar", "plates", "dumbbells", "kettlebell", "flat_bench", "adjustable_bench",
                    "power_rack", "smith_machine", "leg_press", "hack_squat_machine", "lat_pulldown", "cable_stack",
                    "rope_attachment", "v_bar", "dip_station", "pull_up_bar", "assist_band", "resistance_band",
                    "leg_curl_machine", "leg_extension_machine", "calf_machine", "chest_press_machine",
                    "shoulder_press_machine", "pec_deck", "plate_loaded_machine", "machine_other", "hip_abductor_machine",
                    "hip_adductor_machine", "back_extension_bench", "ghd", "landmine", "preacher_bench", "ab_wheel", "box",
                    "medicine_ball", "exercise_ball", "foam_roller", "treadmill", "exercise_bike", "recumbent_bike", "rower",
                    "elliptical", "stair_climber", "skipping_rope", "battle_ropes", "air_bike", "other"]
SKILL_TAGS = ["pull_up", "chin_up", "dip", "push_up", "pistol_squat", "box_jump", "jump", "muscle_up", "handstand",
              "dead_hang", "ab_rollout", "olympic_lift", "nordic_curl"]
MUSCLE_GROUPS = {"chest": ["chest"], "back": ["lats", "middle back", "lower back", "traps"], "shoulders": ["shoulders"],
                 "arms": ["biceps", "triceps", "forearms"], "core": ["abdominals"], "quads": ["quadriceps"],
                 "hamstrings": ["hamstrings"], "glutes": ["glutes"], "calves": ["calves"], "hips": ["abductors", "adductors"],
                 "neck": ["neck"]}

def split_areas(spec):
    p, s2 = spec.split(";")
    return p.split(), s2.split()

def heuristic_areas(e):
    pat = e["movement_pattern"]
    if pat in PATTERN_AREAS:
        p, s2 = (x.split() for x in PATTERN_AREAS[pat])
        n = e["name"].lower()
        if pat == "pull_h" and has(n, "bent over", "bent-over", "t-bar"): p = p + ["lower_back"]
        if pat == "core" and has(n, "plank", "rollout", "roller", "hanging", "bridge"): s2 = s2 + ["shoulder"]
        if pat == "core" and has(n, "hanging"): s2 = s2 + ["wrist"]
        return p, [a for a in s2 if a not in p]
    prim = [MUSCLE_AREA[m] for m in e["primary_muscles"]]
    sec = [MUSCLE_AREA[m] for m in e["secondary_muscles"]]
    if pat == "mobility": return [], sorted(set(prim + sec))
    extra = {"elbow": ["wrist"], "neck": ["upper_back"], "calf": ["ankle"]}
    p = sorted(set(prim + [x for a in prim for x in extra.get(a, [])]))
    return p, sorted(set(sec) - set(p))

def heuristic_kit(e):
    n, eq = e["name"].lower(), e["equipment"][0]
    k = []
    if eq == "barbell":
        k += ["barbell", "plates"]
        if has(n, "incline", "decline"): k.append("adjustable_bench")
        elif has(n, "bench", "floor press") and not has(n, "bench squat"): k.append("flat_bench")
        if has(n, "squat", "lunge", "good morning", "military", "shoulder press", "overhead", "bench press"): k.append("power_rack")
        if has(n, "landmine", "t-bar"): k.append("landmine")
    elif eq == "ez_bar": k += ["ez_bar", "plates"]
    elif eq == "dumbbell":
        k.append("dumbbells")
        if has(n, "incline", "decline", "seated"): k.append("adjustable_bench")
        elif has(n, "bench", "fly", "flye", "pullover"): k.append("flat_bench")
    elif eq == "kettlebell": k.append("kettlebell")
    elif eq == "cable":
        k.append("cable_stack")
        if has(n, "rope"): k.append("rope_attachment")
        if has(n, "pulldown"): k = ["lat_pulldown"] + (["v_bar"] if has(n, "v-bar") else [])
    elif eq == "machine":
        for kw, tag in [("smith", "smith_machine"), ("leg press", "leg_press"), ("hack", "hack_squat_machine"),
                        ("leverage", "plate_loaded_machine"), ("leg curl", "leg_curl_machine"),
                        ("leg extension", "leg_extension_machine"), ("calf", "calf_machine"),
                        ("treadmill", "treadmill"), ("elliptical", "elliptical"), ("recumbent", "recumbent_bike"),
                        ("bicycling", "exercise_bike"), ("rowing", "rower"), ("stairmaster", "stair_climber"),
                        ("step mill", "stair_climber")]:
            if has(n, kw): k.append(tag); break
        else: k.append("machine_other")
        if k[0] in ("smith_machine", "plate_loaded_machine"): k.append("plates")
    elif eq == "bands": k.append("resistance_band")
    elif eq in ("medicine_ball", "exercise_ball", "foam_roller"): k.append(eq)
    elif eq == "other": k.append("other")
    if has(n, "pull-up", "pullup", "pull up", "chin-up", "chin up", "chinup") and "pulldown" not in n: k.append("pull_up_bar")
    if has(n, "dip") and not has(n, "dip machine"): k.append("dip_station")
    if has(n, "hanging"): k.append("pull_up_bar")
    return list(dict.fromkeys(k))

def heuristic_skills(e):
    n = e["name"].lower(); t = []
    if has(n, "pull-up", "pullup", "pull up") and not has(n, "assisted", "band assisted", "scapular"): t += ["pull_up", "dead_hang"]
    if has(n, "chin-up", "chin up", "chinup") and not has(n, "assisted"): t += ["chin_up", "dead_hang"]
    if has(n, "dip") and not has(n, "dip machine", "bench dip"): t.append("dip")
    if has(n, "push-up", "pushup", "push up") and not has(n, "incline push"): t.append("push_up")
    if has(n, "pistol"): t.append("pistol_squat")
    if has(n, "box jump"): t.append("box_jump")
    if e["category"] == "plyometrics" or has(n, "jump", "hop", "bound"): t.append("jump")
    if has(n, "muscle up", "muscle-up"): t.append("muscle_up")
    if has(n, "handstand"): t.append("handstand")
    if has(n, "hanging", "toes to bar"): t.append("dead_hang")
    if has(n, "rollout", "ab roller", "fallout"): t.append("ab_rollout")
    if e["movement_pattern"] == "olympic": t.append("olympic_lift")
    if has(n, "natural glute ham", "floor glute-ham", "nordic"): t.append("nordic_curl")
    return list(dict.fromkeys(t))

out = []
for x in RAW:
    e = {
        "id": x["id"],
        "name": x["name"],
        "aliases": [],
        "category": x["category"],
        "primary_muscles": x["primaryMuscles"],
        "secondary_muscles": x["secondaryMuscles"],
        "equipment": equipment(x),
        "movement_pattern": PATTERN_FIX_ALL.get(x["id"]) or pattern(x),
        "mechanic": x.get("mechanic"),
        "force": x.get("force"),
        "level": LEVEL[x["level"]],
        "unilateral": unilateral(x["name"]),
        "staple": x["id"] in STAPLES,
        "display_name": META[x["id"]][0] if x["id"] in META else None,
    }
    if x["id"] in META:
        e["aliases"] = [a for a in META[x["id"]][1].split("/") if a]
    if x["id"] in MUSCLE_FIX:
        sec, stab = MUSCLE_FIX[x["id"]]
        e["secondary_muscles"] = [m.replace("_", " ") for m in sec.split()]
        e["stabilisers"] = [m.replace("_", " ") for m in stab.split()]
    else:
        e["stabilisers"] = []
    e["load_convention"] = LOAD_FIX.get(x["id"]) or load_convention(e)
    e["increment_class"] = increment_class(e)
    if x["id"] in META:
        _, _, ar, kit, sk = META[x["id"]]
        pa, sa = split_areas(ar)
        e["equipment_detail"] = kit.split()
        e["skill_tags"] = sk.split()
    else:
        pa, sa = heuristic_areas(e)
        e["equipment_detail"] = heuristic_kit(e)
        e["skill_tags"] = heuristic_skills(e)
    e["body_areas"] = [{"area": a, "load": "primary"} for a in pa] + [{"area": a, "load": "secondary"} for a in sa]
    e.update({
        "swaps": [],
        "cues": CUES.get(x["id"], []),
        "instructions": x["instructions"],
        "contraindications": [],
        "derived": {"movement_pattern": True, "swaps": x["id"] not in HAND_SWAPS, "unilateral": True,
                    "load_convention": x["id"] not in LOAD_FIX, "increment_class": True,
                    "body_areas": x["id"] not in META, "equipment_detail": x["id"] not in META,
                    "skill_tags": x["id"] not in META, "muscles": x["id"] not in MUSCLE_FIX},
        "sources": [{"title": "free-exercise-db", "org": "yuhonas (from wrkout/exercises.json)",
                     "url": "https://github.com/yuhonas/free-exercise-db", "year": 2024}],
        "licence": "Unlicense (public domain) for source text; cues are our own wording; images NOT included (provenance unclear)",
    })
    if x["id"] in ("Barbell_Deadlift", "Sumo_Deadlift", "Trap_Bar_Deadlift"):
        e["sources"].append({"title": "Electromyographic activity in deadlift exercise and its variants. A systematic review",
                             "org": "Martin-Fuentes, Oliva-Lozano, Muyor, PLoS One",
                             "url": "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0229507", "year": 2020,
                             "used_for": "secondary muscles / stabilisers"})
    out.append(e)
BY_ID = {e["id"]: e for e in out}

# ---- hand swaps for staples
for sid, spec in HAND_SWAPS.items():
    lst = []
    for tok in spec.split(","):
        i, code = tok.strip().rsplit(" ", 1)
        assert i in BY_ID, f"unknown swap id {i} for {sid}"
        assert i != sid
        lst.append({"id": i, "reason": REASON[code]})
    BY_ID[sid]["swaps"] = lst

# ---- ranked heuristic swaps for everything else
def eqc(e): return EQ_CLASS[e["equipment"][0]]
def tier(e): return LOAD_TIER[eqc(e)]

def reason(e, o):
    lo, le = LEVEL_RANK[o["level"]], LEVEL_RANK[e["level"]]
    if lo < le or (tier(o) < tier(e) and eqc(o) == "bodyweight"): return "easier_regression"
    if lo > le: return "harder_progression"
    if eqc(o) != eqc(e): return "same_pattern_diff_kit"
    return "same_muscle"

def score(e, o):
    s = 4 * o["staple"]
    s += 2 * (o["primary_muscles"][:1] == e["primary_muscles"][:1])
    s += 1 * (eqc(o) == eqc(e)) + 1 * (o["level"] == e["level"]) + 0.5 * (o["mechanic"] == e["mechanic"])
    s += 0.5 * (o["unilateral"] == e["unilateral"])
    s -= 1 * abs(tier(o) - tier(e))
    if tier(e) == 3 and e["mechanic"] == "compound" and eqc(o) in ("bodyweight", "bands"): s -= 4  # load-comparable
    return s

by_pat = collections.defaultdict(list)
for e in out: by_pat[e["movement_pattern"]].append(e)
for e in out:
    if e["id"] in HAND_SWAPS: continue
    p = set(e["primary_muscles"])
    cands = [(score(e, o), o) for o in by_pat[e["movement_pattern"]] if o is not e and p & set(o["primary_muscles"])]
    if not cands and e["movement_pattern"] not in ("mobility",):  # fallback: same muscle, any loaded pattern
        cands = [(score(e, o) - 2, o) for o in out if o is not e and p & set(o["primary_muscles"])
                 and o["movement_pattern"] not in ("mobility", "cardio")]
    cands.sort(key=lambda t: (-t[0], t[1]["id"]))
    e["swaps"] = [{"id": o["id"],
                   "reason": reason(e, o) if o["movement_pattern"] == e["movement_pattern"] else "same_muscle"}
                  for _, o in cands[:6]]

# ---- checks
assert all(m in MUSCLES for e in out for m in e["primary_muscles"] + e["secondary_muscles"])
assert all(q in EQUIPMENT for e in out for q in e["equipment"]), {q for e in out for q in e["equipment"]} - set(EQUIPMENT)
assert set(HAND_SWAPS) == STAPLES == set(CUES), (STAPLES - set(HAND_SWAPS), STAPLES - set(CUES))
assert all(2 <= len(c) <= 4 for c in CUES.values())
# v0.1.2 asserts
assert all(e["display_name"] for e in out if e["staple"]), "display_name missing on a staple"
assert all(b["area"] in BODY_AREAS and b["load"] in ("primary", "secondary") for e in out for b in e["body_areas"])
assert all(any(b["load"] == "primary" for b in e["body_areas"]) for e in out if e["staple"]), "staple without primary area"
assert all(len({b["area"] for b in e["body_areas"]}) == len(e["body_areas"]) for e in out), "duplicate area"
assert all(t in EQUIPMENT_DETAIL for e in out for t in e["equipment_detail"]), {t for e in out for t in e["equipment_detail"]} - set(EQUIPMENT_DETAIL)
assert all(t in SKILL_TAGS for e in out for t in e["skill_tags"])
assert all(m in MUSCLES for e in out for m in e["stabilisers"])
assert all(not (set(e["stabilisers"]) & set(e["primary_muscles"] + e["secondary_muscles"])) for e in out)
assert sorted(m for g in MUSCLE_GROUPS.values() for m in g) == sorted(MUSCLES), "muscle_groups must cover every muscle exactly once"
assert all(e["movement_pattern"] == "push_h" for e in out if e["id"] in ("Machine_Bench_Press", "Smith_Machine_Bench_Press"))
AREA_MAP = {a: {"primary": sorted(e["id"] for e in out if {"area": a, "load": "primary"} in e["body_areas"]),
                "secondary": sorted(e["id"] for e in out if {"area": a, "load": "secondary"} in e["body_areas"])}
            for a in BODY_AREAS}

json.dump({"version": "0.1.3", "generated": "2026-09-23", "count": len(out),
           "enums": {"muscles": MUSCLES, "equipment": EQUIPMENT,
                     "movement_pattern": ["squat", "hinge", "lunge", "push_h", "push_v", "pull_h", "pull_v", "carry", "core",
                                          "isolation", "cardio", "plyometric", "olympic", "mobility"],
                     "load_convention": ["total", "per_hand", "per_side", "bodyweight", "bodyweight_plus", "assisted"],
                     "increment_class": ["upper", "lower"],
                     "swap_reason": list(REASON.values()),
                     "level": ["beginner", "intermediate", "advanced"],
                     "body_areas": BODY_AREAS, "body_area_sided": SIDED, "body_area_side": ["left", "right", "both"],
                     "body_area_load": ["primary", "secondary"],
                     "equipment_detail": EQUIPMENT_DETAIL, "skill_tags": SKILL_TAGS},
           "muscle_groups": MUSCLE_GROUPS,
           "body_area_map": {"notes": "area -> exercise ids that load it. primary = the area takes real load; secondary = it is involved "
                                      "(grip, stabilising). Side-agnostic: exclusion applies to both sides. Staples hand-checked; "
                                      "others heuristic (see derived.body_areas). Mobility moves are listed as secondary only.",
                             "areas": AREA_MAP},
           "exercises": out},
          open("data/exercises.json", "w"), indent=1, ensure_ascii=False)

no_swaps = [e for e in out if not e["swaps"]]
print("exercises", len(out), "| no swaps:", len(no_swaps), "(mobility:", sum(e["movement_pattern"] == "mobility" for e in no_swaps), ")")
print("load_convention", collections.Counter(e["load_convention"] for e in out))
print("increment_class", collections.Counter(e["increment_class"] for e in out))
print("equipment", collections.Counter(e["equipment"][0] for e in out))
