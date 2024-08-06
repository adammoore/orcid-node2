import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ForceGraph2D } from 'react-force-graph';
import { Card, CardHeader, CardContent } from '../Card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const InstitutionalDashboard = ({ orcidData, institutionName }) => {
  const [workDistribution, setWorkDistribution] = useState([]);
  const [collaborationNetwork, setCollaborationNetwork] = useState({ nodes: [], links: [] });
  const [topResearchers, setTopResearchers] = useState([]);

  useEffect(() => {
    calculateWorkDistribution();
    calculateCollaborationNetwork();
    calculateTopResearchers();
  }, [orcidData, institutionName]);

  const calculateWorkDistribution = () => {
    const distribution = orcidData.reduce((acc, researcher) => {
      researcher.works.forEach(work => {
        const type = work.type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
      });
      return acc;
    }, {});

    setWorkDistribution(Object.entries(distribution).map(([name, value]) => ({ name, value })));
  };

  const calculateCollaborationNetwork = () => {
    const nodes = orcidData.map(researcher => ({
      id: researcher.orcid,
      name: researcher.name,
      val: researcher.works.length
    }));

    const links = [];
    orcidData.forEach((researcher1, index1) => {
      orcidData.slice(index1 + 1).forEach(researcher2 => {
        const commonWorks = researcher1.works.filter(work1 =>
          researcher2.works.some(work2 => work1.doi === work2.doi)
        );
        if (commonWorks.length > 0) {
          links.push({
            source: researcher1.orcid,
            target: researcher2.orcid,
            value: commonWorks.length
          });
        }
      });
    });

    setCollaborationNetwork({ nodes, links });
  };

  const calculateTopResearchers = () => {
    const researchers = orcidData.map(researcher => ({
      name: researcher.name,
      works: researcher.works.length,
      citations: researcher.works.reduce((acc, work) => acc + (work.citationCount || 0), 0)
    }));

    setTopResearchers(researchers.sort((a, b) => b.works - a.works).slice(0, 10));
  };

  return (
    <div className="institutional-dashboard">
      <Card>
        <CardHeader>Institutional Dashboard for {institutionName}</CardHeader>
        <CardContent>
          <h2>Work Distribution by Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={workDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {workDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <h2>Top 10 Researchers by Work Count</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topResearchers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="works" fill="#8884d8" name="Number of Works" />
              <Bar dataKey="citations" fill="#82ca9d" name="Number of Citations" />
            </BarChart>
          </ResponsiveContainer>

          <h2>Researcher Collaboration Network</h2>
          <div style={{ height: '600px' }}>
            <ForceGraph2D
              graphData={collaborationNetwork}
              nodeLabel="name"
              nodeVal="val"
              linkWidth={link => Math.sqrt(link.value)}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const label = node.name;
                const fontSize = 12/globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = node.color;
                ctx.fillText(label, node.x, node.y);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstitutionalDashboard;
