/**
 * Script de debug para verificar rounds no Supabase
 * Execute: npx ts-node debug_rounds.ts (ou rode em console)
 */

import supabase from './services/supabase';
import supabaseService from './services/supabaseService';

async function debugRounds() {
  console.log('🔍 Verificando rounds no Supabase...\n');

  try {
    // 1. Contar total de matches
    const { count: matchCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });
    console.log(`📊 Total de matches: ${matchCount}`);

    // 2. Contar total de rounds
    const { count: roundCount } = await supabase
      .from('rounds')
      .select('*', { count: 'exact', head: true });
    console.log(`📍 Total de rounds: ${roundCount}`);

    // 3. Listar matches e contar rounds para cada
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select('id, map_name')
      .limit(5);

    if (matchError) throw matchError;

    console.log('\n📋 Primeiros 5 matches e suas contagens:\n');

    for (const match of matches || []) {
      const { count, data: roundsForMatch } = await supabase
        .from('rounds')
        .select('match_id')
        .eq('match_id', match.id);

      console.log(`  Match ID: ${match.id}`);
      console.log(`  Map: ${match.map_name}`);
      console.log(`  Rounds encontrados: ${count}`);
      
      if (count === 0) {
        // Buscar primeiro round no banco e mostrar seu match_id
        const { data: firstRound } = await supabase
          .from('rounds')
          .select('match_id')
          .limit(1);
        
        if (firstRound && firstRound.length > 0) {
          console.log(`  ⚠️ Exemplo de match_id em rounds: ${firstRound[0].match_id}`);
        }
      }
      console.log('');
    }

    // 4. Verificar matches sem rounds
    console.log('\n⚠️ Verificando matches sem rounds...');
    const missing = await supabaseService.getMatchesMissingRounds();
    console.log(`Encontrados ${missing.length} matches sem rounds:`);
    missing.slice(0, 5).forEach(id => console.log(`  - ${id}`));

    // 5. Amostra de match_ids dos rounds
    console.log('\n📍 Match_ids únicos nos rounds (amostra):');
    const { data: roundSample } = await supabase
      .from('rounds')
      .select('match_id')
      .limit(1);
    
    if (roundSample) {
      const uniqueMatchIds = new Set(roundSample.map((r: any) => r.match_id));
      Array.from(uniqueMatchIds).slice(0, 3).forEach(id => {
        console.log(`  - ${id}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugRounds();
