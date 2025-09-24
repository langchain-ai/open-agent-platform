interface NonInterruptedDescriptionViewProps {
  // Component might be extended with additional props in the future
  _unused?: boolean;
}

export function NonInterruptedDescriptionView(
  _props: NonInterruptedDescriptionViewProps,
) {
  return (
    <div className="w-full pt-6 pb-2">
      <p className="text-sm text-gray-500 italic">
        This thread has no additional description.
      </p>
    </div>
  );
}
