export default function HomeCard({
  title,
  description,
  onClick,
}) {
  return (
    <div className="home-card" onClick={onClick}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}