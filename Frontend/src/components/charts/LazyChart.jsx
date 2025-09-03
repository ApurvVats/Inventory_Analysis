// Frontend/src/components/charts/LazyChart.jsx
import React, { useRef } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { useInView } from 'react-intersection-observer';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
// Register all the necessary components for Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);
export default function LazyChart({ type, data, options, title }) {
  const chartRef = useRef(null);
  const { ref, inView } = useInView({
    triggerOnce: true, // Only trigger once
    threshold: 0.1,    // Trigger when 10% of the component is visible
    fallbackInView: true,
  });
  const exportChart = () => {
    const imageLink = chartRef.current?.toBase64Image();
    if (imageLink) {
      const a = document.createElement('a');
      a.href = imageLink;
      a.download = `${title.replace(/\s+/g, '-')}-chart.png`;
      a.click();
    }
  };
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return <Bar ref={chartRef} data={data} options={options} />;
      case 'line':
        return <Line ref={chartRef} data={data} options={options} />;
      case 'pie':
        return <Pie ref={chartRef} data={data} options={options} />;
      default:
        return null;
    }
  };
  return (
    <div ref={ref} className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <button
          onClick={exportChart}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded"
        >
          Export
        </button>
      </div>
      {inView ? renderChart() : <Skeleton height={300} />}
    </div>
  );
}