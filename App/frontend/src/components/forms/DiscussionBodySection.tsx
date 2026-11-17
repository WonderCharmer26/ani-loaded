import { DiscussionFormApi } from "@/types/discussionForm";
import { getFieldErrorMessage } from "./getFieldErrorMessage";

type DiscussionBodySectionProps = {
  form: DiscussionFormApi;
};

// body section of the discussion form (reusable for the list section)
export default function DiscussionBodySection({
  form,
}: DiscussionBodySectionProps) {
  return (
    <form.Field
      name="body"
      children={(field) => {
        const errorMessage = getFieldErrorMessage(field.state.meta.errors?.[0]);

        return (
          <div className="flex flex-col gap-1">
            <textarea
              id={field.name}
              name={field.name}
              aria-label="Body"
              value={field.state.value ?? ""}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="What's on your mind?"
              className="field-sizing-content min-h-45 w-full resize-none bg-transparent font-geist text-base/6.5 text-[#C3CBD8] placeholder:text-[#5F6A7B] focus:outline-none"
            />
            {errorMessage ? (
              <span className="block font-geist text-sm text-red-400">{errorMessage}</span>
            ) : null}
          </div>
        );
      }}
    />
  );
}
