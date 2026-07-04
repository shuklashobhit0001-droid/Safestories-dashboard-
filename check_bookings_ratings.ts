import pool from './lib/db';

async function checkBookingsRatings() {
  try {
    // Get column info
    const columnsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'bookings'
      ORDER BY column_name
    `);

    console.log('\n📋 BOOKINGS TABLE COLUMNS:\n');
    columnsResult.rows.forEach((col: any) => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });

    // Check for ratings data
    const ratingColumn = columnsResult.rows.find((col: any) =>
      col.column_name.toLowerCase().includes('rating') ||
      col.column_name.toLowerCase().includes('feedback')
    );

    if (ratingColumn) {
      console.log(`\n✅ Found: ${ratingColumn.column_name}\n`);

      // Check if ratings populated
      const ratingData = await pool.query(`
        SELECT COUNT(*) as total, COUNT(${ratingColumn.column_name}) as with_rating
        FROM bookings
      `);

      const total = ratingData.rows[0].total;
      const withRating = ratingData.rows[0].with_rating;

      console.log(`Total bookings: ${total}`);
      console.log(`With ratings: ${withRating}`);
      console.log(`Empty: ${total - withRating}`);

      // Show sample ratings
      console.log(`\nSample ratings:`);
      const samples = await pool.query(`
        SELECT invitee_name, ${ratingColumn.column_name} as rating, booking_start_at
        FROM bookings
        WHERE ${ratingColumn.column_name} IS NOT NULL
        LIMIT 5
      `);

      samples.rows.forEach((row: any) => {
        console.log(`- ${row.invitee_name}: ${JSON.stringify(row.rating)}`);
      });
    } else {
      console.log('\n❌ No ratings/feedback column found in bookings table\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBookingsRatings();
