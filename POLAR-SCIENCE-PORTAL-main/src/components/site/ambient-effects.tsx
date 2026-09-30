import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

export function AmbientEffects() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sections = document.querySelectorAll("main > section, main .depth-card");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.07 },
    );
    sections.forEach((el) => {
      el.classList.add("scroll-reveal");
      observer.observe(el);
    });
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = (event.target as HTMLElement).closest<HTMLElement>(".depth-card");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty(
        "--tilt-x",
        `${(-(event.clientY - rect.top - rect.height / 2) / rect.height) * 5}deg`,
      );
      target.style.setProperty(
        "--tilt-y",
        `${((event.clientX - rect.left - rect.width / 2) / rect.width) * 5}deg`,
      );
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => {
      observer.disconnect();
      document.removeEventListener("pointermove", move);
      sections.forEach((el) => el.classList.remove("scroll-reveal"));
    };
  }, [path]);
  return null;
}
