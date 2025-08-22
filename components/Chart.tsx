import { useEffect, useState } from "react";
import { LineGraph } from "react-native-graph";

export default function Chart() {
  // Sample data points for demonstration
  const sampleData = [
    { x: 0, y: 50 },
    { x: 1, y: 65 },
    { x: 2, y: 85 },
    { x: 3, y: 95 },
    { x: 4, y: 120 },
    { x: 5, y: 135 },
    { x: 6, y: 153 },
    { x: 7, y: 180 },
    { x: 8, y: 200 },
    { x: 9, y: 225 },
    { x: 10, y: 250 },
    { x: 11, y: 280 },
    { x: 12, y: 310 },
    { x: 13, y: 340 },
    { x: 14, y: 375 },
    { x: 15, y: 400 },
    { x: 16, y: 435 },
    { x: 17, y: 470 },
    { x: 18, y: 500 },
    { x: 19, y: 535 },
    { x: 20, y: 575 },
    { x: 21, y: 610 },
    { x: 22, y: 650 },
    { x: 23, y: 690 },
    { x: 24, y: 725 },
    { x: 25, y: 775 }
  ];

  const [visiblePoints, setVisiblePoints] = useState<typeof sampleData>([]);

  useEffect(() => {
    // Reset animation when component mounts
    setVisiblePoints([]);

    // Generate random volatile points with upward trend
    const points = sampleData.map((point, index) => {
      // Base upward trend
      const trendValue = point.y * (1 + Math.random() * 0.2); // 0-20% increase
      
      // Add volatility
      const volatility = trendValue * (Math.random() * 0.4 - 0.2); // ±20% volatility
      const finalValue = Math.max(trendValue + volatility, point.y * 0.9); // Prevent too much downside
      
      setTimeout(() => {
        setVisiblePoints(prev => [...prev, {
          x: point.x,
          y: finalValue
        }]);
      }, index * 800);
    });
  }, []);

  return (
    <LineGraph 
      points={visiblePoints.map(point => ({
        value: point.y,
        date: new Date(point.x * 1000) // Convert x to timestamp
      }))}
      color="#00ff9d"
      animated={true}
      style={{ height: 200, width: '100%' }}
    />
  );
}