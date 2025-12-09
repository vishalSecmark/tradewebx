"use client";

type SkipLinkProps = {
  targetId: string;
  label?: string;
};

const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  label = "Skip to main content",
}) => {
  return (
    <a className="skip-link" href={`#${targetId}`}>
      {label}
    </a>
  );
};

export default SkipLink;
