export const TASKS = {
  SIGN_UP: {
    id: "SIGN_UP",
    title: "welcome to the jelloverse!",
    description: "create your account and profile",
    points: 10,
    repeatable: false,
    require_proof: false,
  },
  CREATE_JAM: {
    id: "CREATE_JAM",
    title: "jam creator",
    description: "create a jam",
    points: 40,
    repeatable: true,
    require_proof: false,
  },
  ATTEND_JAM: {
    id: "ATTEND_JAM",
    title: "jiggle time!",
    description: "attend a jam. the more you attend, the more ⭐ you earn!",
    points: 10,
    repeatable: true,
    require_proof: false,
  },
  RIDE_TOKTOK: {
    id: "RIDE_TOKTOK",
    title: "tuktuk rider",
    description: "ride a tuktuk",
    points: 20,
    repeatable: false,
    require_proof: true,
  },
  // Come up with tasks that that are fun and maximize the user's experience in Ahangama
  VISIT_TEA_PLANTATION: {
    id: "VISIT_TEA_PLANTATION",
    title: "englishman in ahangama",
    description: "visit a tea plantation",
    points: 40,
    repeatable: false,
    require_proof: true,
  },
  HAVE_FISH_CURRY: {
    id: "HAVE_FISH_CURRY",
    title: "local foodie",
    description: "try fish ambul thiyal",
    points: 20,
    repeatable: false,
    require_proof: true,
  },
} as const;

export type TaskId = keyof typeof TASKS;
