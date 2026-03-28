declare const __GIT_SHA__: string;

const Footer = () => {
  const sha = __GIT_SHA__;
  const shortSha = sha.slice(0, 7);
  return (
    <footer class="flex items-center gap-1.5 text-slate-500 text-xs">
      <a href="https://arenpatel.com" target="_blank" rel="noopener noreferrer" class="hover:text-slate-300 transition">
        Aren Patel
      </a>
      <span aria-hidden="true">·</span>
      <a
        href="https://x.com/aren55555"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="@aren55555 on X"
        class="hover:text-slate-300 transition"
      >
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.633 5.905-5.633zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      <span aria-hidden="true">·</span>
      <a
        href={`https://github.com/aren55555/txtshr/commit/${sha}`}
        target="_blank"
        rel="noopener noreferrer"
        class="font-mono hover:text-slate-300 transition"
      >
        {shortSha}
      </a>
      <span aria-hidden="true">·</span>
      <span class="text-slate-600" title="Made in Canada">
        {new Date().getFullYear()}
        {" "}
        <svg class="inline w-4 h-4 opacity-50" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
          <path d="M383.8 351.7c2.5-2.5 105.2-92.4 105.2-92.4l-17.5-7.5c-10-4.9-7.4-11.5-5-17.4 2.4-7.6 20.1-67.3 20.1-67.3s-47.7 10-57.7 12.5c-7.5 2.4-10-2.5-12.5-7.5s-15-32.4-15-32.4-52.6 59.9-55.1 62.3c-10 7.5-20.1 0-17.6-10 0-10 27.6-129.6 27.6-129.6s-30.1 17.4-40.1 22.4c-7.5 5-12.6 5-17.6-5C293.5 72.3 255.9 0 255.9 0s-37.5 72.3-42.5 79.8c-5 10-10 10-17.6 5-10-5-40.1-22.4-40.1-22.4S183.3 182 183.3 192c2.5 10-7.5 17.5-17.6 10-2.5-2.5-55.1-62.3-55.1-62.3S98.1 167 95.6 172s-5 9.9-12.5 7.5C73 177 25.4 167 25.4 167s17.6 59.7 20.1 67.3c2.4 6 5 12.5-5 17.4L23 259.3s102.6 89.9 105.2 92.4c5.1 5 10 7.5 5.1 22.5-5.1 15-10.1 35.1-10.1 35.1s95.2-20.1 105.3-22.6c8.7-.9 18.3 2.5 18.3 12.5S241 512 241 512h30s-5.8-102.7-5.8-112.8 9.5-13.4 18.4-12.5c10 2.5 105.2 22.6 105.2 22.6s-5-20.1-10-35.1 0-17.5 5-22.5z" />
        </svg>
      </span>
    </footer>
  );
}

export default Footer;
