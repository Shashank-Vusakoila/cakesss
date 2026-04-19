export function FoodCardSkeleton() {
  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-card border border-gray-50">
      <div className="skeleton h-56 w-full" />
      <div className="p-8 space-y-4">
        <div className="skeleton h-6 w-3/4 rounded-lg" />
        <div className="skeleton h-3 w-full rounded-md" />
        <div className="skeleton h-3 w-2/3 rounded-md" />
        <div className="flex justify-between items-center pt-6 mt-4 border-t border-gray-50">
          <div className="skeleton h-6 w-20 rounded-lg" />
          <div className="skeleton h-12 w-24 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-card border border-gray-50 space-y-5">
      <div className="flex justify-between items-center">
        <div className="skeleton h-5 w-32 rounded-lg" />
        <div className="skeleton h-4 w-20 rounded-md" />
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 w-full rounded-md" />
        <div className="skeleton h-3 w-3/4 rounded-md" />
      </div>
      <div className="flex justify-between items-end pt-4 border-t border-gray-50">
        <div className="skeleton h-10 w-28 rounded-xl" />
        <div className="skeleton h-5 w-24 rounded-lg" />
      </div>
    </div>
  )
}
