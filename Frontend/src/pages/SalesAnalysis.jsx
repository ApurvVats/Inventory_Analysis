import React from "react";
import "./SalesAnalysis.css";

export default function SalesAnalysis() {
  return (
    <div className="sa-wrap">
      <div className="sa-header">
        <h2>Sales Analysis</h2>
        <span className="sa-sub">Coming soon: Top ASINs, Refunds, Locations, and Overview.</span>
      </div>

      <div className="sa-cards">
        <div className="sa-card">
          <div className="sa-card-h">Top ASINs</div>
          <div className="sa-card-b">Rank by sales and quantity with pagination.</div>
        </div>
        <div className="sa-card">
          <div className="sa-card-h">Refunds</div>
          <div className="sa-card-b">Refund % and amounts per ASIN (7/14/30 day filters).</div>
        </div>
        <div className="sa-card">
          <div className="sa-card-h">Locations</div>
          <div className="sa-card-b">Top states/cities and location-wise ASIN sales.</div>
        </div>
        <div className="sa-card">
          <div className="sa-card-h">Overview</div>
          <div className="sa-card-b">Quantities by fulfillment, payment code, transaction type.</div>
        </div>
      </div>
    </div>
  );
}
