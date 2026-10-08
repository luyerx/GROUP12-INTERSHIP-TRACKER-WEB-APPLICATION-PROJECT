// Original local vector artwork. Decorative; never represents user progress or data.
export default function CareerIllustration({ variant = "journey" }: { variant?: "journey" | "resources" | "employer" | "planner" | "hiring" }) {
  return <svg className="career-illustration" viewBox="0 0 480 340" fill="none" aria-hidden="true" focusable="false">
    <path d="M36 290H446M64 315H420" stroke="currentColor" opacity=".2" />
    <circle cx="350" cy="99" r="72" fill="#d7e6d6" />
    {variant === "planner" ? <>
      <rect x="88" y="68" width="250" height="210" rx="8" fill="#fffdf7" stroke="#124b46" strokeWidth="3" />
      <path d="M88 115H338M126 51V82M295 51V82" stroke="#124b46" strokeWidth="8" strokeLinecap="round" />
      <path d="M113 147H144V177H113ZM163 147H194V177H163ZM213 147H244V177H213ZM263 147H294V177H263Z" fill="#c9d9c2" />
      <path d="M113 197H144V227H113ZM163 197H194V227H163ZM213 197H244V227H213Z" fill="#e2e9db" />
      <path d="M170 160L177 167L190 151" stroke="#124b46" strokeWidth="3" strokeLinecap="round" />
      <path d="M306 253L363 106L380 113L323 260L303 272Z" fill="#c4815c" /><path d="M306 253L323 260L303 272Z" fill="#124b46" />
    </> : variant === "hiring" ? <>
      <rect x="73" y="92" width="282" height="184" rx="7" fill="#fffdf7" stroke="#124b46" strokeWidth="3" />
      <path d="M73 134H355" stroke="#b9ccc0" strokeWidth="3" />
      <circle cx="97" cy="113" r="4" fill="#c4815c" /><circle cx="113" cy="113" r="4" fill="#789a8c" />
      <rect x="101" y="159" width="75" height="85" rx="3" fill="#dce7d6" /><circle cx="138" cy="181" r="13" fill="#325d56" /><path d="M115 222C115 192 161 192 161 222" fill="#325d56" />
      <path d="M198 172H321M198 194H302M198 216H271" stroke="#789a8c" strokeWidth="6" />
      <rect x="298" y="210" width="80" height="62" rx="5" fill="#c4815c" /><path d="M320 210V198H354V210M320 238L331 249L355 226" stroke="#fffdf7" strokeWidth="5" />
    </> : variant === "resources" ? <>
      <path d="M80 104L215 71L346 103V273L215 246L80 278V104Z" fill="#fffdf7" stroke="#124b46" strokeWidth="3" />
      <path d="M215 71V246M108 132L184 113M108 158L184 139M108 184L169 168M242 129L318 147M242 157L318 174M242 185L289 196" stroke="#789a8c" strokeWidth="5" />
      <path d="M279 87V165L296 155L314 174V96" fill="#c4815c" /><path d="M350 245L396 129L408 134L362 250Z" fill="#124b46" />
    </> : <>
      <path d="M209 290V244H273V194H337V142H407V290H209Z" fill={variant === "employer" ? "#acc7ba" : "#b9ccc0"} />
      <path d="M273 244V194H337V142H407" stroke="#124b46" strokeWidth="3" />
      <path d="M116 257L101 291H74L99 246L116 257ZM165 231L188 279L177 290H155L148 246L165 231Z" fill="#153d39" />
      <path d="M125 173L172 184L169 245L146 253L134 211L119 267L95 257L106 193Z" fill="#325d56" />
      <path d="M120 109C144 96 162 110 167 133L178 176L148 196L104 179L105 135Z" fill="#c4815c" />
      <path d="M160 124L192 146L221 132L229 146L193 166L154 152" fill="#c4815c" />
      <path d="M220 132L234 126L240 135L229 146" fill="#d5a37e" /><circle cx="133" cy="85" r="23" fill="#d5a37e" />
      <path d="M110 85C98 52 146 45 157 70L147 84L143 69L119 77V94Z" fill="#183e39" />
      <rect x="75" y="160" width="42" height="58" rx="3" transform="rotate(-12 75 160)" fill="#fbf8e8" />
      <path d="M86 172L101 169M87 180L108 175M89 188L105 184" stroke="#8ba595" strokeWidth="3" />
      <path d="M275 109C282 78 309 58 350 56M338 43L354 55L340 70" stroke="#124b46" strokeWidth="3" strokeLinecap="round" />
    </>}
    <path d="M415 285V233M415 260C390 260 389 238 389 238C411 237 415 260 415 260ZM416 249C440 249 440 224 440 224C415 228 416 249 416 249Z" stroke="#497261" strokeWidth="4" />
  </svg>;
}
