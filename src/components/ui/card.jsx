export function Card({ children, ...props }) {
    return <div className="bg-white rounded shadow border p-2" {...props}>{children}</div>;
  }
  
  export function CardContent({ children, ...props }) {
    return <div className="p-2" {...props}>{children}</div>;
  }
  