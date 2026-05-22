import "./CategoryCard.css";

export default function CategoryCard({
  icon,
  title,
  description,
  isActive,
  onClick,
}) {
  return (
    <button
      className={`category-card${isActive ? " active" : ""}`}
      type="button"
      onClick={onClick}
    >

      <div className="category-icon">
        {icon}
      </div>

      <h2>{title}</h2>

      <p>{description}</p>

    </button>
  );
}
