export const TASKS = {
  SIGN_UP: {
    id: "SIGN_UP",
    title: "Welcome to the Jelloverse!",
    description: "Create your account and profile",
    points: 10,
    repeatable: false,
    require_proof: false,
  },
  CREATE_JAM: {
    id: "CREATE_JAM",
    title: "Jam Creator",
    description: "Create a jam",
    points: 10,
    repeatable: true,
    require_proof: false,
  },
  ATTEND_JAM: {
    id: "ATTEND_JAM",
    title: "Jiggle Time!",
    description: "Attend a jam. The more you attend, the more ⭐ you earn!",
    points: 10,
    repeatable: true,
    require_proof: false,
  },
  RIDE_TOKTOK: {
    id: "RIDE_TOKTOK",
    title: "TukTuk Rider",
    description: "Ride a TukTuk",
    points: 10,
    repeatable: false,
    require_proof: true,
  },
} as const;

export type TaskId = keyof typeof TASKS;
