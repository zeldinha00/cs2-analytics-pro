import subprocess
import json
import sys

demo = r"C:\Users\Roger\Desktop\betboom-t-vs-gentle-mates-ct-m2-mirage.dem"

# Executar parser
result = subprocess.run(
    [sys.executable, "parse_demo.py", demo, "test.dem"],
    capture_output=True,
    text=True
)

# Tentar carregar JSON da stdout
try:
    # Procura pela linha JSON (última linha não vazia)
    lines = result.stdout.strip().split('\n')
    json_line = lines[-1]
    data = json.loads(json_line)
    
    print("✅ MIRAGE - Resultado:")
    print(f"Score: {data['teamA']['score']} x {data['teamB']['score']}")
    print(f"TeamA (CT lado) parciais: {data['teamA']['halfScores']}")
    print(f"TeamB (T lado) parciais: {data['teamB']['halfScores']}")
    
    # Calcular placar
    a_first = data['teamA']['halfScores']['firstHalf']
    a_second = data['teamA']['halfScores']['secondHalf']
    b_first = data['teamB']['halfScores']['firstHalf']
    b_second = data['teamB']['halfScores']['secondHalf']
    
    print(f"\nParciais display:")
    print(f"TeamA: {a_first}:{b_first} (primeira) + {a_second}:{b_second} (segunda)")
    print(f"Esperado (HLTV): 6:6 (primeira) + 7:0 (segunda)")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    print(f"Stdout length: {len(result.stdout)}")
    print(f"Stderr: {result.stderr[:500]}")
