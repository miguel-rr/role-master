/**
 * The tapered red rule of the 5e books (Homebrewery's `horizontalRule.svg`)
 * and its thinner dndbeyond stat-block cousin. Colour follows `currentColor`
 * so the same shape works in maroon on paper and in brass on charcoal.
 */
type TaperedRuleProps = {
  className?: string;
  variant?: 'book' | 'stat';
};

const TaperedRule = ({ className, variant = 'book' }: TaperedRuleProps) =>
  variant === 'book' ? (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      preserveAspectRatio="none"
      viewBox="0 0 762.29 18.4"
    >
      <path d="M0,9.06S406.1,0,381.53,0,762.29,8.7,762.29,8.7s-350.49,10-381.53,9.69S0,9.06,0,9.06Z" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      preserveAspectRatio="none"
      viewBox="0 0 226.08 3"
    >
      <path
        d="M666,482c5.76,0,226.08-1.5,226.08-1.5S671.76,479,666,479Z"
        transform="translate(-666 -479)"
      />
    </svg>
  );

export { TaperedRule };
