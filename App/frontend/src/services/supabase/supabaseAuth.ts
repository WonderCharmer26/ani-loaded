import type { UserAttributes } from "@supabase/supabase-js";

import { supabase } from "./supabaseConnection";
import { toast } from "sonner";

// NOTE: Make sure that the session doesn't persist so that the user has to sign back in

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    // check if there was an error
    if (error) {
      return { data, error };
    }

    // no error
    return { data, error: null };
  } catch (error) {
    // return nothing and the error
    console.log(error); // WARNING: remove in before prod

    // return { data: null, error: error as Error };
  }
};

export const signOutUser = async () => {
  return supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  // NOTE: has jwt param that we can pass in
  return supabase.auth.getUser();
};

export const updateUserPassword = async (password: string) => {
  return supabase.auth.updateUser({ password });
};

export const updateUserMetadata = async (data: UserAttributes["data"]) => {
  return supabase.auth.updateUser({ data });
};
