import styles from "./cards.module.scss";
import { Card, CardProps } from "./card";

export function Cards({ cards }: { cards: CardProps[] }) {
  return (
    <div className={styles.cards}>
      {cards.map(card => (
        <Card key={card.href} {...card} />
      ))}
    </div>
  );
}
