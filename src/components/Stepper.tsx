import clsx from "clsx";

export default function Stepper({ steps, activeIndex }: { steps: string[]; activeIndex: number }) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={clsx(
            "w-6 h-6 rounded-full text-xs flex items-center justify-center border",
            i <= activeIndex ? "bg-[#6B1B56] text-white border-[#6B1B56]" : "bg-white text-zinc-600 border-zinc-200"
          )}>
            {i+1}
          </div>
          <div className={clsx("text-sm", i === activeIndex ? "font-semibold" : "text-zinc-600")}>{s}</div>
          {i !== steps.length - 1 && <div className="w-8 h-px bg-zinc-200" />}
        </div>
      ))}
    </div>
  );
}
