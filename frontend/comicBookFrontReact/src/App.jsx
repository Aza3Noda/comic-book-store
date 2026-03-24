import { useEffect, useState } from "react";

function App() {
  const [comics, setComics] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8080/comics")
      .then(res => res.json())
      .then(data => setComics(data));
  }, []);

  return (
    <div>
      <h1>Comic Catalog</h1>
      {comics.map(c => (
        <div key={c.id}>
          <h3>{c.title}</h3>
          <p>{c.author}</p>
          <p>{c.price} €</p>
        </div>
      ))}
    </div>
  );
}

export default App;