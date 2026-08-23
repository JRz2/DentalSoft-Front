import * as React from "react";
import { cn } from "@/lib/utils";

export const VisuallyHidden = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
    <span
        ref={ref}
        className={cn(
            "absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden whitespace-nowrap border-0",
            className
        )}
        {...props}
    />
));
VisuallyHidden.displayName = "VisuallyHidden";