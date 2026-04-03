import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Lock } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface DemographicData {
  age_range: Record<string, number>;
  gender: Record<string, number>;
  ethnicity: Record<string, number>;
  education_level: Record<string, number>;
  totalResponses: number;
}

interface DemographicsInsightsProps {
  data: DemographicData;
  totalReviews: number;
  minReviewsThreshold?: number;
  isEmployerView?: boolean;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(30, 80%, 55%)",
  "hsl(170, 65%, 45%)",
  "hsl(330, 70%, 50%)",
];

const formatDataForChart = (data: Record<string, number>) => {
  return Object.entries(data)
    .filter(([key]) => key !== "Prefer not to say" && key !== null)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">
          {payload[0].value} responses ({Math.round((payload[0].value / payload[0].payload.total) * 100)}%)
        </p>
      </div>
    );
  }
  return null;
};

const DemographicChart = ({ 
  title, 
  data, 
  total 
}: { 
  title: string; 
  data: Record<string, number>; 
  total: number;
}) => {
  const chartData = formatDataForChart(data).map(item => ({ ...item, total }));
  
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="horizontal" 
              verticalAlign="bottom" 
              align="center"
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const DemographicsInsights = ({ 
  data, 
  totalReviews, 
  minReviewsThreshold = 10,
  isEmployerView = false 
}: DemographicsInsightsProps) => {
  const hasEnoughReviews = totalReviews >= minReviewsThreshold;
  const responseRate = totalReviews > 0 
    ? Math.round((data.totalResponses / totalReviews) * 100) 
    : 0;

  if (!hasEnoughReviews && !isEmployerView) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">Demographic Insights</p>
              <p className="text-sm">
                We need at least {minReviewsThreshold} reviews to share demographic insights. 
                Currently {totalReviews} review{totalReviews !== 1 ? 's' : ''} submitted.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if we have any demographic data at all
  const hasData = data.totalResponses > 0;

  if (!hasData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">Demographic Insights</p>
              <p className="text-sm">
                No demographic data has been shared by reviewers yet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Demographic Insights</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Based on {data.totalResponses} response{data.totalResponses !== 1 ? 's' : ''} ({responseRate}% of reviewers)
        </p>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Aggregated, anonymous demographic data shared voluntarily by reviewers.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <DemographicChart 
          title="Age Distribution" 
          data={data.age_range} 
          total={Object.values(data.age_range).reduce((a, b) => a + b, 0)}
        />
        <DemographicChart 
          title="Gender" 
          data={data.gender} 
          total={Object.values(data.gender).reduce((a, b) => a + b, 0)}
        />
        <DemographicChart 
          title="Ethnicity" 
          data={data.ethnicity} 
          total={Object.values(data.ethnicity).reduce((a, b) => a + b, 0)}
        />
        <DemographicChart 
          title="Education Level" 
          data={data.education_level} 
          total={Object.values(data.education_level).reduce((a, b) => a + b, 0)}
        />
      </div>
    </div>
  );
};

export default DemographicsInsights;
