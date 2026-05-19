import "./CategoryCard.css";

export default function CategoryCard({
  icon,
  title,
  description,
}) {
  return (
    <div className="category-card">

      <div className="category-icon">
        {icon}
      </div>

      <h2>{title}</h2>

      <p>{description}</p>

    </div>
  );
}