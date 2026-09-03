import { APP_CONFIG } from "../config";

export default function BusinessName() {
  return (
    <div className="business-name">
      {APP_CONFIG.BUSINESS_NAME}
      <style jsx>{`
        .business-name {
          color: #111827;
          font-size: 1.5rem;
          font-weight: 800;
          line-height: 1.2;
        }
      `}</style>
    </div>
  );
}
