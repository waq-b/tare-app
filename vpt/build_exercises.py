"""Build data/exercises.json (contract shape) from free-exercise-db (Unlicense).

v0.1.1: staples (111) get hand-curated swaps + cues from staples.py.
Everything else: heuristic movement pattern + ranked swaps, flagged in `derived`.
"""
import json, re, collections
from staples import SWAPS as HAND_SWAPS, CUES

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
    n = name.lower()
    return any(w in n for w in words)

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
        "movement_pattern": pattern(x),
        "mechanic": x.get("mechanic"),
        "force": x.get("force"),
        "level": LEVEL[x["level"]],
        "unilateral": unilateral(x["name"]),
        "staple": x["id"] in STAPLES,
    }
    e["load_convention"] = load_convention(e)
    e["increment_class"] = increment_class(e)
    e.update({
        "swaps": [],
        "cues": CUES.get(x["id"], []),
        "instructions": x["instructions"],
        "contraindications": [],
        "derived": {"movement_pattern": True, "swaps": x["id"] not in HAND_SWAPS, "unilateral": True,
                    "load_convention": True, "increment_class": True},
        "sources": [{"title": "free-exercise-db", "org": "yuhonas (from wrkout/exercises.json)",
                     "url": "https://github.com/yuhonas/free-exercise-db", "year": 2024}],
        "licence": "Unlicense (public domain) for source text; cues are our own wording; images NOT included (provenance unclear)",
    })
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

json.dump({"version": "0.1.1", "generated": "2026-09-22", "count": len(out),
           "enums": {"muscles": MUSCLES, "equipment": EQUIPMENT,
                     "movement_pattern": ["squat", "hinge", "lunge", "push_h", "push_v", "pull_h", "pull_v", "carry", "core",
                                          "isolation", "cardio", "plyometric", "olympic", "mobility"],
                     "load_convention": ["total", "per_hand", "per_side", "bodyweight", "bodyweight_plus", "assisted"],
                     "increment_class": ["upper", "lower"],
                     "swap_reason": list(REASON.values()),
                     "level": ["beginner", "intermediate", "advanced"]},
           "exercises": out},
          open("data/exercises.json", "w"), indent=1, ensure_ascii=False)

no_swaps = [e for e in out if not e["swaps"]]
print("exercises", len(out), "| no swaps:", len(no_swaps), "(mobility:", sum(e["movement_pattern"] == "mobility" for e in no_swaps), ")")
print("load_convention", collections.Counter(e["load_convention"] for e in out))
print("increment_class", collections.Counter(e["increment_class"] for e in out))
print("equipment", collections.Counter(e["equipment"][0] for e in out))
