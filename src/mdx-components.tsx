import type { ComponentPropsWithoutRef } from "react";
import type { MDXComponents } from "mdx/types";
import { LogCallout } from "@/components/log/LogCallout";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    LogCallout,
    pre: (props: ComponentPropsWithoutRef<"pre">) => <pre tabIndex={0} {...props} />,
    ...components,
  };
}
