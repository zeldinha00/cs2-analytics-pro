from demoparser2 import DemoParser
import pandas as pd

demo = r'C:\Users\Roger\Desktop\heroic-ct-vs-furia-t-m3-nuke.dem'
parser = DemoParser(demo)
rounds_df = parser.parse_event('round_end')

print("="*70)
print("DEBUG: Rastreando o processamento do round 13")
print("="*70)

# Simular o processamento do parser
rounds_df_clean = rounds_df.dropna(subset=['winner'])
rounds_df_clean = rounds_df_clean.sort_values('tick').reset_index(drop=True)
rounds_df_clean['round'] = rounds_df_clean.index + 1

print("\nAntes da renumeração (índice = novo round number):")
for idx in range(len(rounds_df_clean)):
    if rounds_df_clean.iloc[idx]['round'] in [12, 13, 14]:
        print(f"Index {idx}: round={rounds_df_clean.iloc[idx]['round']}, " +
              f"reason={rounds_df_clean.iloc[idx]['reason']}, " +
              f"winner={rounds_df_clean.iloc[idx]['winner']}")

print("\n" + "="*70)
print("Agrupando por 'round':")
rounds_grouped = rounds_df_clean.groupby('round')

for round_num, round_data in rounds_grouped:
    if round_num in [12, 13, 14]:
        print(f"\nRound {round_num} group:")
        print(round_data[['round', 'reason', 'winner', 'tick']])
        
        # Simular o que o parser faz
        valid_rows = round_data[~round_data['reason'].isna()]
        if not valid_rows.empty:
            last_row = valid_rows.loc[valid_rows['tick'].idxmax()]
            reason_val = last_row['reason']
            winner_val = last_row['winner']
            print(f"  last_row index: {valid_rows['tick'].idxmax()}")
            print(f"  reason_val: {reason_val}")
            print(f"  winner_val: {winner_val}")
