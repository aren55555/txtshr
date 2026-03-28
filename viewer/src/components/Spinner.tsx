const Spinner = (props: { label: string }) => {
  return (
    <div class="flex items-center gap-3 text-slate-400" aria-live="polite">
      <svg class="animate-spin h-5 w-5 text-emerald-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span class="text-sm">{props.label}</span>
    </div>
  );
}

export default Spinner;
