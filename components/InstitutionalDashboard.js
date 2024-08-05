import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ForceGraph2D } from 'react-force-graph';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const InstitutionalDashboard = ({ orcidData, institutionName }) => {
  const [internalWorks, setInternalWorks] = useState(0);
  const [externalWorks, setExternalWorks] = useState(0);
  const [interconnectivityData, setInterconnectivityData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    calculateWorks();
    calculateInterconnectivity();
  }, [orcidData]);

  const calculateWorks = () => {
    let internal = 0;
    let external = 0;

    orcidData.forEach(researcher => {
      researcher.works.forEach(work => {
        if (work.institutions.includes(institutionName)) {
          internal++;
        } else {
          external++;
        }
      });
    });

    setInternalWorks(internal);
    setExternalWorks(external);
  };

  const calculateInterconnectivity = () => {
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

    setInterconnectivityData({ nodes, links });
  };

  return (
    <div>
      <Card>
        <CardHeader>Institutional Dashboard for {institutionName}</CardHeader>
        <CardContent>
          <h2>Work Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[{ name: 'Works', internal: internalWorks, external: externalWorks }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="internal" fill="#8884d8" name="Internal Works" />
              <Bar dataKey="external" fill="#82ca9d" name="External Works" />
            </BarChart>
          </ResponsiveContainer>

          <h2>Researcher Interconnectivity</h2>
          <div style={{ height: '600px' }}>
            <ForceGraph2D
              graphData={interconnectivityData}
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
