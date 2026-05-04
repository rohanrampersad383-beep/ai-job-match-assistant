export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialActionState: ActionState = {
  status: "idle"
};

export function errorState(message: string): ActionState {
  return {
    status: "error",
    message
  };
}

export function successState(message: string): ActionState {
  return {
    status: "success",
    message
  };
}

