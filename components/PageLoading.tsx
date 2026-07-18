type PageLoadingProps = {
  label?: string;
  compact?: boolean;
};

export default function PageLoading({ label = "내용을 준비하고 있어요", compact = false }: PageLoadingProps) {
  return (
    <div className={`page-loading${compact ? " page-loading--compact" : ""}`} role="status" aria-live="polite">
      <div className="page-loading-mark" aria-hidden><i /><i /><i /></div>
      <strong>{label}</strong>
      {!compact && <span>잠시만 기다려 주세요</span>}
    </div>
  );
}
