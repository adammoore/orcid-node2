import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip } from 'recharts';

function AuthorNetworkVisualization({ orcidData }) {
  const data = orcidData.map((author, index) => ({
    x: index,
    y: author.works.length,
    z: 1,
    name: author.name,
    orcid: author.orcid
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <XAxis type="number" dataKey="x" name="index" hide />
        <YAxis type="number" dataKey="y" name="works" />
        <ZAxis type="number" dataKey="z" range={[100, 1000]} name="score" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Authors" data={data} fill="#8884d8" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export default AuthorNetworkVisualization;
