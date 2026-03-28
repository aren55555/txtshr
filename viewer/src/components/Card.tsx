import { JSX } from "solid-js";

const Card = (props: { children: JSX.Element }) => {
  return (
    <div class="w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl shadow-black/50 border border-slate-800 p-8">
      {props.children}
    </div>
  );
}

export default Card;
