import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const AnalyticsCharts = ({ statistics }) => {
  if (!statistics || statistics.length === 0) return null;

  const chartData = statistics.map(s => ({
    name: s.task_topic.length > 20 ? s.task_topic.substring(0, 20) + '...' : s.task_topic,
    fullName: s.task_topic,
    'Успешно (%)': parseFloat((s.success_rate * 100).toFixed(1)),
    'Частично (%)': parseFloat((s.uncertainty * 100).toFixed(1)),
    'Неуспешно (%)': parseFloat((s.failure_rate * 100).toFixed(1)),
    'Относ. сложность': parseFloat(s.relative_difficulty || 0),
  }));

  return (
    <div className="analytics-charts-wrapper" style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div className="chart-block" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h4 style={{ marginBottom: '15px', color: '#333', textAlign: 'left', fontSize: '15px' }}>Распределение результатов по заданиям</h4>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={12} />
              <YAxis tickFormatter={(val) => `${val}%`} stroke="#666" fontSize={12} />
              <Tooltip formatter={(value, name, props) => [`${value}%`, name, props.payload.fullName]} />
              <Legend iconType="circle" />
              <Bar dataKey="Успешно (%)" stackId="a" fill="#4ade80" />
              <Bar dataKey="Частично (%)" stackId="a" fill="#facc15" />
              <Bar dataKey="Неуспешно (%)" stackId="a" fill="#f87171" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-block" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h4 style={{ marginBottom: '5px', color: '#333', textAlign: 'left', fontSize: '15px' }}>Индекс относительной сложности задач</h4>
        
        <div style={{ width: '100%', height: 320 }}> 
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#666" fontSize={12} />
              <YAxis 
                domain={[-0.6, 0.6]} 
                ticks={[-0.6, -0.5, -0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]} 
                stroke="#666" 
                fontSize={12} 
              />
              
              <Tooltip formatter={(value, name, props) => [value, name, props.payload.fullName]} />
              <Legend />
              
              <ReferenceLine y={0} stroke="#333" strokeWidth={1.5} />
              <Bar dataKey="Относ. сложность" fill="#6366f1" maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default AnalyticsCharts;
