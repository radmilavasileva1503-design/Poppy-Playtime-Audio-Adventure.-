import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { X } from 'lucide-react';

type MapModalProps = {
  currentNodeId: string;
  visitedNodes: Set<string>;
  gameNodes: Record<string, any>;
  onClose: () => void;
  highContrast: boolean;
};

export const MapModal: React.FC<MapModalProps> = ({ currentNodeId, visitedNodes, gameNodes, onClose, highContrast }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 600;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height]);

    const g = svg.append('g');

    svg.call(d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
      g.attr('transform', event.transform);
    }));

    // Build graph data
    const nodes: any[] = [];
    const links: any[] = [];
    const addedNodes = new Set<string>();

    // Add all visited nodes and their immediate neighbors
    visitedNodes.forEach(nodeId => {
      if (!gameNodes[nodeId]) return;
      
      if (!addedNodes.has(nodeId)) {
        nodes.push({ id: nodeId, title: gameNodes[nodeId].title, isCurrent: nodeId === currentNodeId, isVisited: true });
        addedNodes.add(nodeId);
      }

      gameNodes[nodeId].choices?.forEach((choice: any) => {
        const targetId = choice.nextId;
        if (!gameNodes[targetId]) return;

        if (!addedNodes.has(targetId)) {
          nodes.push({ id: targetId, title: gameNodes[targetId].title, isCurrent: targetId === currentNodeId, isVisited: visitedNodes.has(targetId) });
          addedNodes.add(targetId);
        }

        links.push({ source: nodeId, target: targetId });
      });
    });

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(50));

    // Draw links
    const link = g.append('g')
      .attr('stroke', highContrast ? '#fff' : '#4b5563')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2);

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(d3.drag<SVGGElement, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    node.append('circle')
      .attr('r', (d) => d.isCurrent ? 20 : 15)
      .attr('fill', (d) => {
        if (d.isCurrent) return '#eab308'; // yellow-500
        if (d.isVisited) return '#3b82f6'; // blue-500
        return '#6b7280'; // gray-500
      })
      .attr('stroke', highContrast ? '#fff' : '#1f2937')
      .attr('stroke-width', 2);

    // Add labels
    node.append('text')
      .text((d) => d.title)
      .attr('x', 25)
      .attr('y', 5)
      .attr('fill', highContrast ? '#fff' : '#d1d5db')
      .style('font-size', '12px')
      .style('font-family', 'sans-serif')
      .style('pointer-events', 'none');

    // Current node pulse effect
    const currentNodes = node.filter(d => d.isCurrent);
    currentNodes.append('circle')
      .attr('r', 25)
      .attr('fill', 'none')
      .attr('stroke', '#eab308')
      .attr('stroke-width', 2)
      .style('opacity', 0.8)
      .transition()
      .duration(1000)
      .ease(d3.easeLinear)
      .attr('r', 40)
      .style('opacity', 0)
      .on('end', function repeat() {
        d3.select(this)
          .attr('r', 25)
          .style('opacity', 0.8)
          .transition()
          .duration(1000)
          .ease(d3.easeLinear)
          .attr('r', 40)
          .style('opacity', 0)
          .on('end', repeat);
      });

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [currentNodeId, visitedNodes, gameNodes, highContrast]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className={`w-full max-w-5xl h-[80vh] flex flex-col rounded-xl border ${highContrast ? 'bg-black border-white' : 'bg-zinc-900 border-zinc-700'}`}>
        <div className="flex justify-between items-center p-4 border-b border-zinc-700">
          <h2 className="text-xl font-bold uppercase tracking-wider text-white">Интерактивна карта</h2>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg ${highContrast ? 'hover:bg-white/20 text-white' : 'hover:bg-white/10 text-zinc-300'}`}
            aria-label="Затвори картата"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 relative overflow-hidden bg-zinc-950 rounded-b-xl">
          <svg ref={svgRef} className="w-full h-full cursor-move" />
          
          <div className="absolute bottom-4 left-4 bg-black/60 p-3 rounded-lg border border-zinc-700 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-white">Текуща локация</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-white">Посетени</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-500"></div>
              <span className="text-white">Непосетени (Възможни)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
