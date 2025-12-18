import pool from '../lib/db';

async function test() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT specialization
      FROM therapists
      WHERE specialization IS NOT NULL
    `);

    const therapySet = new Set<string>();
    result.rows.forEach(row => {
      const specializations = row.specialization.split(',').map((s: string) => s.trim());
      specializations.forEach((spec: string) => therapySet.add(spec));
    });

    const therapies = Array.from(therapySet).sort().map(therapy => ({ therapy_name: therapy }));
    console.log('\nDistinct therapy types:');
    console.log(JSON.stringify(therapies, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();
