'use client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export default function VisitChart({ data }) {
  if (!data || data.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 transition-colors">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
        📊 نسبة الافتقاد لكل وزنة
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              fontFamily: 'Cairo',
              fontSize: 12,
              borderRadius: 12,
              border: '1px solid #e5e7eb',
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'Cairo' }} />
          <Bar dataKey="افتقد" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="ما ردش" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="لم يُفتقد" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
