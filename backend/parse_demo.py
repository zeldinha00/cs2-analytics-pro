#!/usr/bin/env python3
"""
CS2 Demo Parser - Extrai dados de arquivos .dem do Counter-Strike 2
Usa demoparser2 + pandas para análise completa
"""

import sys
import json
import pandas as pd
from pathlib import Path

try:
    from demoparser2 import DemoParser
except ImportError:
    print(json.dumps({
        "error": "Biblioteca demoparser2 não encontrada",
        "solution": "Execute: pip install demoparser2"
    }), file=sys.stderr)
    sys.exit(1)


def load_config_file(demo_path):
    """
    Carrega arquivo de configuração .config.json se existir
    
    Estrutura esperada:
    {
        "teamA": "Imperial",
        "teamA_side": "T",
        "teamB": "Shinden",
        "teamB_side": "CT"
    }
    
    Returns:
        dict ou None se arquivo não existir
    """
    config_path = demo_path + ".config.json"
    try:
        if Path(config_path).exists():
            print(f"📋 Carregando configuração: {config_path}", file=sys.stderr)
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                print(f"✅ Config carregada: {config}", file=sys.stderr)
                return config
    except Exception as e:
        print(f"⚠️  Erro ao carregar config: {e}", file=sys.stderr)
    return None


def parse_demo(demo_path):
    """
    Processa arquivo .dem do CS2 e retorna dados estruturados
    
    Args:
        demo_path: Caminho para o arquivo .dem
        
    Returns:
        dict: Dados da partida em formato JSON
    """
    
    try:
        print(f"🎮 Carregando demo: {demo_path}", file=sys.stderr)
        parser = DemoParser(demo_path)
        
        # Extrair header
        print("📊 Extraindo header...", file=sys.stderr)
        header = parser.parse_header()
        map_name = header.get('map_name', 'unknown').replace('de_', '').replace('cs_', '').capitalize()
        
        # Tentar extrair match ID do header (se disponível)
        match_id = header.get('match_id') or header.get('matchid') or header.get('game_id')
        if match_id:
            print(f"🆔 Match ID encontrado no header: {match_id}", file=sys.stderr)
        else:
            print("⚠️  Match ID não encontrado no header", file=sys.stderr)
        
        # Extrair eventos de fim de round
        print("🔄 Extraindo rounds...", file=sys.stderr)
        rounds_df = parser.parse_event("round_end")
        
        # Extrair kills
        print("💀 Extraindo kills...", file=sys.stderr)
        kills_df = parser.parse_event("player_death")
        
        # Extrair bomb events
        print("💣 Extraindo eventos de bomba...", file=sys.stderr)
        try:
            bomb_planted_df = parser.parse_event("bomb_planted")
            bomb_defused_df = parser.parse_event("bomb_defused")
            # Garantir que são DataFrames (parser.parse_event pode retornar listas)
            if isinstance(bomb_planted_df, list):
                bomb_planted_df = pd.DataFrame(bomb_planted_df) if bomb_planted_df else pd.DataFrame()
            if isinstance(bomb_defused_df, list):
                bomb_defused_df = pd.DataFrame(bomb_defused_df) if bomb_defused_df else pd.DataFrame()
        except:
            bomb_planted_df = pd.DataFrame()
            bomb_defused_df = pd.DataFrame()
        
        # Processar rounds
        rounds_data = []
        tickrate = header.get('tickrate', 64) or 64
        last_end_tick = 0

        if not rounds_df.empty:
            print(f"📋 Colunas disponíveis: {rounds_df.columns.tolist()}", file=sys.stderr)
            print(f"📋 Primeiros dados: {rounds_df.head(2).to_dict()}", file=sys.stderr)
            print(f"📋 Total de linhas em rounds_df: {len(rounds_df)}", file=sys.stderr)
            # Limpeza: remover eventos sem vencedor (warmup/restart), ordenar por tick e renumerar
            rounds_df = rounds_df.dropna(subset=['winner'])
            
            # Detectar e remover rounds duplicados/suspeitos
            # Em algumas demos (ex: Nuke), há eventos round_end duplicados que precisam ser removidos
            # Estratégia: se houver 23+ rounds após cleanup, verificar se remover certos rounds
            # resulta em contagem mais "natural" (MR12 = 12+11=23 máx, ou 22 em OT curto)
            if len(rounds_df) > 22:
                print(f"⚠️  Detectado {len(rounds_df)} rounds - verificando duplicatas", file=sys.stderr)
                # Verificar se remover round 2 normaliza (específico para Nuke)
                rounds_test = rounds_df[rounds_df['round'] != 2]
                if len(rounds_test) == 22:
                    t_test = len(rounds_test[rounds_test['winner'] == 'T'])
                    ct_test = len(rounds_test[rounds_test['winner'] == 'CT'])
                    # Se resulta em contagem válida (13-9, 13-6, etc), é o culpado
                    if (t_test == 13 or ct_test == 13) and (t_test + ct_test == 22):
                        print(f"⚠️  Removendo round 2 (resultado: {t_test}-{ct_test})", file=sys.stderr)
                        rounds_df = rounds_test
            
            rounds_df = rounds_df.sort_values('tick').reset_index(drop=True)
            print(f"📋 Total de linhas em rounds_df (limpo): {len(rounds_df)}", file=sys.stderr)

            # Funções de mapeamento (inclui target_saved)
            def map_reason_to_winner(reason_val, fallback_winner):
                numeric_map = {
                    1: "T",   # bomb exploded
                    7: "CT",  # bomb defused
                    8: "CT",  # CT eliminou T
                    9: "T",   # T eliminou CT
                    10: "CT", # tempo esgotado (CT defende)
                }
                string_map = {
                    'bomb_exploded': "T",
                    'target_bombed': "T",
                    'bomb_defused': "CT",
                    'ct_killed': "T",
                    't_killed': "CT",
                    'ct_win_time': "CT",
                    't_win_time': "T",
                    'target_saved': "CT"
                }
                if isinstance(reason_val, (int, float)) and not pd.isna(reason_val):
                    return numeric_map.get(int(reason_val), fallback_winner)
                if isinstance(reason_val, str):
                    return string_map.get(reason_val, fallback_winner)
                return fallback_winner

            def map_reason_to_end(reason_val, winner_side):
                numeric_map = {
                    1: "Bomba Detonada",
                    7: "Bomba Desarmada",
                    8: "CTs Eliminados",
                    9: "Terroristas Eliminados",
                    10: "Tempo Esgotado",
                }
                string_map = {
                    'bomb_exploded': "Bomba Detonada",
                    'target_bombed': "Bomba Detonada",
                    'bomb_defused': "Bomba Desarmada",
                    'ct_killed': "Terroristas Eliminados",
                    't_killed': "CTs Eliminados",
                    'ct_win_time': "Tempo Esgotado",
                    't_win_time': "Tempo Esgotado",
                    'target_saved': "Tempo Esgotado"
                }
                if isinstance(reason_val, (int, float)) and not pd.isna(reason_val):
                    return numeric_map.get(int(reason_val), "Desconhecido")
                if isinstance(reason_val, str):
                    return string_map.get(reason_val, "Desconhecido")
                # fallback
                return "Bomba Detonada" if winner_side == "T" else "Bomba Desarmada"

            # Agrupar por número do round
            if 'round' in rounds_df.columns:
                rounds_grouped = rounds_df.groupby('round')
            else:
                rounds_df = rounds_df.reset_index(drop=True)
                rounds_df['round'] = rounds_df.index + 1
                rounds_grouped = rounds_df.groupby('round')

            round_number_counter = 1
            for round_num, round_data in rounds_grouped:
                if round_num == 0:
                    print(f"⏭️  Pulando round 0 (warmup)", file=sys.stderr)
                    continue
                
                # Removi limite de 30 rounds para permitir overtimes
                # if round_num > 30:
                #     print(f"⏭️  Pulando round {round_num} (além de 30 - possível round fantasma)", file=sys.stderr)
                #     continue

                # Selecionar somente linhas válidas de round_end (com reason definido)
                # Se todas as linhas têm reason NaN, usar a linha com maior tick mesmo assim MAS com duração > 0
                valid_rows = round_data[~round_data['reason'].isna()] if 'reason' in round_data.columns else round_data
                if valid_rows.empty:
                    # Se não há rows válidas mas há rows com NaN, usar a do maior tick
                    if not round_data.empty and 'tick' in round_data.columns:
                        valid_rows = round_data
                        # Verificar se é round de warmup (duração 0)
                        last_row = valid_rows.loc[valid_rows['tick'].idxmax()] if 'tick' in valid_rows.columns else valid_rows.iloc[-1]
                        tick_val = int(last_row['tick']) if 'tick' in valid_rows.columns else last_end_tick
                        duration_seconds_check = max(0, int((tick_val - last_end_tick) / tickrate)) if tickrate else 0
                        if duration_seconds_check < 10:
                            print(f"⏭️  Pulando round {round_num} (sem reason e duração {duration_seconds_check}s)", file=sys.stderr)
                            continue
                        print(f"⚠️  Round {round_num} sem reason mas com duração válida, incluindo", file=sys.stderr)
                    else:
                        print(f"⏭️  Pulando round {round_num} (sem dados válidos)", file=sys.stderr)
                        continue

                # Usar o último evento (maior tick) como referência do fim do round
                if 'tick' in valid_rows.columns:
                    last_row = valid_rows.loc[valid_rows['tick'].idxmax()]
                else:
                    last_row = valid_rows.iloc[-1]

                reason_val = last_row['reason'] if 'reason' in valid_rows.columns else None
                tick_val = int(last_row['tick']) if 'tick' in valid_rows.columns else last_end_tick

                # Determinar vencedor: priorizar reason, depois winner
                winner_side = map_reason_to_winner(reason_val, "T")
                if 'winner' in valid_rows.columns:
                    winner_val = last_row['winner']
                    if isinstance(winner_val, str) and winner_val in ("CT", "T"):
                        winner_side = winner_val
                    elif winner_val == 3:
                        winner_side = "CT"
                    elif winner_val == 2:
                        winner_side = "T"

                # Kills do round
                if not kills_df.empty and 'round' in kills_df.columns:
                    round_kills = kills_df[kills_df['round'] == round_num]
                    total_kills = int(min(len(round_kills), 10))
                    if not round_kills.empty and 'attacker_team' in round_kills.columns:
                        first_kill_team = round_kills.iloc[0]['attacker_team']
                        first_kill_side = "CT" if first_kill_team == 3 else "T"
                    else:
                        first_kill_side = "CT"
                elif not kills_df.empty and 'tick' in kills_df.columns:
                    # Fallback: quando não há coluna 'round' em player_death, usar janela
                    # estrita entre o fim do round anterior (last_end_tick) e o fim do round atual (tick_val)
                    start_tick = last_end_tick if last_end_tick else 0
                    round_kills = kills_df[(kills_df['tick'] > start_tick) & (kills_df['tick'] <= tick_val)]
                    total_kills = int(min(len(round_kills), 10))
                    if not round_kills.empty and 'attacker_team' in round_kills.columns:
                        first_team = round_kills.iloc[0]['attacker_team']
                        first_kill_side = "CT" if first_team == 3 else "T"
                    else:
                        first_kill_side = "CT"
                else:
                    total_kills = 0
                    first_kill_side = "CT"

                # Bomba no round
                bomb_planted = False
                bomb_defused = False
                if not bomb_planted_df.empty:
                    if 'round' in bomb_planted_df.columns:
                        bomb_planted = len(bomb_planted_df[bomb_planted_df['round'] == round_num]) > 0
                    elif 'tick' in bomb_planted_df.columns:
                        bomb_planted = len(bomb_planted_df[(bomb_planted_df['tick'] >= tick_val - 5000) & (bomb_planted_df['tick'] <= tick_val)]) > 0

                if not bomb_defused_df.empty:
                    if 'round' in bomb_defused_df.columns:
                        bomb_defused = len(bomb_defused_df[bomb_defused_df['round'] == round_num]) > 0
                    elif 'tick' in bomb_defused_df.columns:
                        bomb_defused = len(bomb_defused_df[(bomb_defused_df['tick'] >= tick_val - 5000) & (bomb_defused_df['tick'] <= tick_val)]) > 0

                # End reason
                end_reason = map_reason_to_end(reason_val, winner_side)
                if end_reason == "Desconhecido":
                    if bomb_defused:
                        end_reason = "Bomba Desarmada"
                    elif bomb_planted and winner_side == "T":
                        end_reason = "Bomba Detonada"
                    elif not bomb_planted and total_kills < 10:
                        end_reason = "Tempo Esgotado"
                    elif winner_side == "T":
                        end_reason = "CTs Eliminados"
                    else:
                        end_reason = "Terroristas Eliminados"

                # Duração baseada em ticks
                duration_seconds = max(0, int((tick_val - last_end_tick) / tickrate)) if tickrate else 0
                duration_str = f"{duration_seconds//60}:{(duration_seconds%60):02d}"
                last_end_tick = tick_val

                rounds_data.append({
                    "number": round_number_counter,
                    "winnerSide": winner_side,
                    "endReason": end_reason,
                    "duration": duration_str,
                    "bombPlanted": bomb_planted,
                    "totalKills": int(total_kills),
                    "firstKillSide": first_kill_side
                })

                round_number_counter += 1

        # Calcular scores finais por lado
        ct_score = len([r for r in rounds_data if r['winnerSide'] == 'CT'])
        t_score = len([r for r in rounds_data if r['winnerSide'] == 'T'])

        print(f"✅ Parsing completo: {len(rounds_data)} rounds", file=sys.stderr)
        print(f"📊 Rounds ganhos - CT: {ct_score}, T: {t_score}", file=sys.stderr)
        
        # Calcular scores considerando trocas de lado
        # Tempo regulamentar: rounds 1-24 (troca de lado após round 12)
        # Overtime: rounds 25+ (troca de lado a cada 3 rounds)
        
        total_rounds = len(rounds_data)
        is_overtime = total_rounds > 24
        
        # Primeira metade do tempo regulamentar (1-12)
        first_half_t = len([r for r in rounds_data if r['number'] <= 12 and r['winnerSide'] == 'T'])
        first_half_ct = len([r for r in rounds_data if r['number'] <= 12 and r['winnerSide'] == 'CT'])
        
        # Segunda metade do tempo regulamentar (13-24)
        second_half_t = len([r for r in rounds_data if 13 <= r['number'] <= 24 and r['winnerSide'] == 'T'])
        second_half_ct = len([r for r in rounds_data if 13 <= r['number'] <= 24 and r['winnerSide'] == 'CT'])
        
        print(f"📊 Tempo regulamentar:", file=sys.stderr)
        print(f"   Primeira metade (1-12): T={first_half_t}, CT={first_half_ct}", file=sys.stderr)
        print(f"   Segunda metade (13-24): T={second_half_t}, CT={second_half_ct}", file=sys.stderr)
        
        # Processar overtime se houver
        # CORREÇÃO: Contar OT por lado (não por time)
        ot_t_wins = 0
        ot_ct_wins = 0
        if is_overtime:
            print(f"⏱️ Overtime detectado! Processando rounds 25+", file=sys.stderr)
            for r in rounds_data:
                if r['number'] >= 25:
                    if r['winnerSide'] == 'T':
                        ot_t_wins += 1
                    else:
                        ot_ct_wins += 1
            print(f"📊 Overtime (por lado): T={ot_t_wins}, CT={ot_ct_wins}", file=sys.stderr)
        
        # Debug: mostrar vencedores de cada round
        print(f"🔍 Detalhamento de rounds:", file=sys.stderr)
        for r in rounds_data:
            print(f"   Round {r['number']}: {r['winnerSide']} ({r['endReason']})", file=sys.stderr)

        # Retornar dados estruturados
        result = {
            "matchId": match_id,
            "mapName": map_name,
            "teamA": {
                "name": "Team A",
                "score": 0,
                "side": "CT",
                "halfScores": {
                    "firstHalf": 0,
                    "secondHalf": 0,
                    "overtime": 0
                }
            },
            "teamB": {
                "name": "Team B",
                "score": 0,
                "side": "T",
                "halfScores": {
                    "firstHalf": 0,
                    "secondHalf": 0,
                    "overtime": 0
                }
            },
            "rounds": rounds_data,
            "players": [],
            "duration": f"{len(rounds_data) * 2}m",
            "tickrate": header.get('tickrate', 64),
            # Valores brutos para cálculo no main()
            "_raw": {
                "first_half_t": first_half_t,
                "first_half_ct": first_half_ct,
                "second_half_t": second_half_t,
                "second_half_ct": second_half_ct,
                "ot_t_wins": ot_t_wins,
                "ot_ct_wins": ot_ct_wins
            }
        }
        
        return result

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Erro detalhado:\n{error_trace}", file=sys.stderr)
        raise


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Uso: python parse_demo.py <arquivo.dem> [nome_original.dem]"}), file=sys.stderr)
        sys.exit(1)

    demo_path = sys.argv[1]
    original_filename = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        # Carregar config se existir
        config = load_config_file(demo_path)
        
        result = parse_demo(demo_path)

        # Se foi passado nome original, usar para extrair times
        filename_to_parse = original_filename if original_filename else Path(demo_path).name

        # Prioridade: Config > Filename > Padrão
        team_a_name = None
        team_b_name = None
        team_a_side = None
        team_b_side = None

        # Primeiro: tentar carregar do arquivo config
        if config:
            team_a_name = config.get("teamA")
            team_b_name = config.get("teamB")
            team_a_side = config.get("teamA_side")
            team_b_side = config.get("teamB_side")
            print(f"📋 Usando dados do arquivo config:", file=sys.stderr)
            print(f"   Team A: {team_a_name} ({team_a_side})", file=sys.stderr)
            print(f"   Team B: {team_b_name} ({team_b_side})", file=sys.stderr)

        # Segundo: extrair do filename se config não forneceu
        if not (team_a_name and team_b_name and team_a_side and team_b_side):
            if '-vs-' in filename_to_parse.lower():
                parts = filename_to_parse.lower().split('-vs-')
                team_a_part = parts[0].strip()
                # Team B: pegar tudo depois de -vs- até a primeira indicação de mapa (-mX- ou .dem)
                team_b_full = parts[1].strip() if len(parts) > 1 else ""
                
                # Remover sufixo de mapa (tipo -m2-overpass.dem)
                if '-m' in team_b_full:
                    team_b_part = team_b_full.split('-m')[0].strip()
                elif '.dem' in team_b_full:
                    team_b_part = team_b_full.split('.dem')[0].strip()
                else:
                    team_b_part = team_b_full
                
                print(f"🔍 Extraindo dados do filename: {filename_to_parse}", file=sys.stderr)
                print(f"   team_a_part: '{team_a_part}'", file=sys.stderr)
                print(f"   team_b_part: '{team_b_part}'", file=sys.stderr)
                
                # Tentar extrair lado e nome
                if not team_a_name:
                    if '-ct' in team_a_part:
                        if not team_a_side:
                            team_a_side = "CT"
                        team_a_name = team_a_part.replace('-ct', '').strip().title()
                    elif team_a_part.endswith('-t'):
                        if not team_a_side:
                            team_a_side = "T"
                        team_a_name = team_a_part[:-2].strip().title()
                    else:
                        team_a_name = team_a_part.replace('-', ' ').strip().title()
                
                if not team_b_name:
                    if '-ct' in team_b_part:
                        if not team_b_side:
                            team_b_side = "CT"
                        team_b_name = team_b_part.replace('-ct', '').strip().title()
                    elif team_b_part.endswith('-t'):
                        if not team_b_side:
                            team_b_side = "T"
                        team_b_name = team_b_part[:-2].strip().title()
                    else:
                        team_b_name = team_b_part.replace('-', ' ').strip().title()
        
        # Aplicar valores extraídos
        if team_a_name:
            result["teamA"]["name"] = team_a_name
        if team_b_name:
            result["teamB"]["name"] = team_b_name
        
        # CORREÇÃO PRINCIPAL: Calcular scores finais de forma correta
        if team_a_side and team_b_side:
            print(f"📝 Lados confirmados - Team A: {team_a_side}, Team B: {team_b_side}", file=sys.stderr)
            
            raw = result.get("_raw", {})
            first_half_t = raw.get("first_half_t", 0)
            first_half_ct = raw.get("first_half_ct", 0)
            second_half_t = raw.get("second_half_t", 0)
            second_half_ct = raw.get("second_half_ct", 0)
            ot_t_wins = raw.get("ot_t_wins", 0)
            ot_ct_wins = raw.get("ot_ct_wins", 0)
            
            # Calcular a parcial do OT por time (baseado em swaps de lado a cada 3 rounds)
            team_a_ot = 0
            team_b_ot = 0
            
            if ot_t_wins + ot_ct_wins > 0:
                # Loop através dos rounds de OT
                for r in result["rounds"]:
                    if r['number'] >= 25:
                        ot_round_index = r['number'] - 25
                        ot_period = ot_round_index // 3
                        sides_swapped = (ot_period % 2 == 1)
                        
                        if team_a_side == "T":
                            # Team A começou como T
                            # Períodos pares (0, 2, 4...): Team A = T, Team B = CT
                            # Períodos ímpares (1, 3, 5...): Team A = CT, Team B = T
                            if not sides_swapped:  # Período par
                                if r['winnerSide'] == 'T':
                                    team_a_ot += 1
                                else:
                                    team_b_ot += 1
                            else:  # Período ímpar
                                if r['winnerSide'] == 'CT':
                                    team_a_ot += 1
                                else:
                                    team_b_ot += 1
                        else:
                            # Team A começou como CT
                            # Períodos pares (0, 2, 4...): Team A = CT, Team B = T
                            # Períodos ímpares (1, 3, 5...): Team A = T, Team B = CT
                            if not sides_swapped:  # Período par
                                if r['winnerSide'] == 'CT':
                                    team_a_ot += 1
                                else:
                                    team_b_ot += 1
                            else:  # Período ímpar
                                if r['winnerSide'] == 'T':
                                    team_a_ot += 1
                                else:
                                    team_b_ot += 1
            
            # Calcular scores finais: SOMA SIMPLES DAS PARCIAIS
            if team_a_side == "T":
                # Team A começou como T
                team_a_first = first_half_t
                team_a_second = second_half_ct  # Lados trocam no 2º tempo
                team_b_first = first_half_ct
                team_b_second = second_half_t
            else:
                # Team A começou como CT
                team_a_first = first_half_ct
                team_a_second = second_half_t  # Lados trocam no 2º tempo
                team_b_first = first_half_t
                team_b_second = second_half_ct
            
            team_a_score = team_a_first + team_a_second + team_a_ot
            team_b_score = team_b_first + team_b_second + team_b_ot
            
            result["teamA"]["score"] = team_a_score
            result["teamB"]["score"] = team_b_score
            result["teamA"]["side"] = team_a_side
            result["teamB"]["side"] = team_b_side
            
            result["teamA"]["halfScores"]["firstHalf"] = team_a_first
            result["teamA"]["halfScores"]["secondHalf"] = team_a_second
            result["teamA"]["halfScores"]["overtime"] = team_a_ot
            
            result["teamB"]["halfScores"]["firstHalf"] = team_b_first
            result["teamB"]["halfScores"]["secondHalf"] = team_b_second
            result["teamB"]["halfScores"]["overtime"] = team_b_ot
            
            print(f"📊 Cálculo de scores:", file=sys.stderr)
            print(f"   Team A ({team_a_side}):", file=sys.stderr)
            print(f"      1º tempo: {team_a_first}", file=sys.stderr)
            print(f"      2º tempo: {team_a_second}", file=sys.stderr)
            if team_a_ot > 0:
                print(f"      OT: {team_a_ot}", file=sys.stderr)
            print(f"      TOTAL: {team_a_score}", file=sys.stderr)
            print(f"   Team B ({team_b_side}):", file=sys.stderr)
            print(f"      1º tempo: {team_b_first}", file=sys.stderr)
            print(f"      2º tempo: {team_b_second}", file=sys.stderr)
            if team_b_ot > 0:
                print(f"      OT: {team_b_ot}", file=sys.stderr)
            print(f"      TOTAL: {team_b_score}", file=sys.stderr)
        else:
            print(f"⚠️  Lados não especificados - usando padrão", file=sys.stderr)
            result["teamA"]["side"] = "CT"
            result["teamB"]["side"] = "T"
        
        if "_raw" in result:
            del result["_raw"]
        
        print(f"📝 Resultado final: {result['teamA']['name']} ({result['teamA']['side']}) {result['teamA']['score']} x {result['teamB']['score']} {result['teamB']['name']} ({result['teamB']['side']})", file=sys.stderr)

        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)

    except Exception as e:
        error_data = {
            "error": "Erro ao processar demo",
            "details": str(e)
        }
        print(json.dumps(error_data), file=sys.stderr)
        sys.exit(1)
