import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, limit } from 'firebase/firestore';

export const seedDatabase = async () => {
  try {
    const candidatesRef = collection(db, 'candidates');
    const snapshot = await getDocs(query(candidatesRef, limit(1)));

    if (snapshot.empty) {
      console.log('Seeding database...');
      
      // Seed Candidates
      const candidates = [
        {
          name: 'Amina Diallo',
          email: 'amina@example.com',
          bio: 'Designer passionnée par les textiles traditionnels africains revisités.',
          photoUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=800&q=80',
          category: 'Fashion',
          voteCount: 1250,
          isEligible: false,
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          name: 'Marc Koffi',
          email: 'marc@example.com',
          bio: 'Artiste sculpteur explorant la fusion entre métal et bois précieux.',
          photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
          category: 'Art',
          voteCount: 840,
          isEligible: false,
          status: 'active',
          createdAt: new Date().toISOString()
        },
        {
          name: 'Sonia Bamba',
          email: 'sonia@example.com',
          bio: 'Créatrice de bijoux contemporains inspirés de la géométrie sacrée.',
          photoUrl: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=800&q=80',
          category: 'Design',
          voteCount: 2100,
          isEligible: true,
          status: 'elite',
          createdAt: new Date().toISOString()
        }
      ];

      for (const c of candidates) {
        const newDoc = doc(candidatesRef);
        await setDoc(newDoc, c);
      }

      // Seed Settings
      await setDoc(doc(db, 'settings', 'global'), {
        moneyFusionApiKey: 'mf_test_key_123456',
        moneyFusionMerchantId: 'MERCH_001',
        votePrice: 100,
        isVotingEnabled: true
      });

      console.log('Seeding complete.');
    } else {
      // Auto-migrate existing seeded candidate photos if they are the old white model photo
      const allSnapshot = await getDocs(candidatesRef);
      for (const d of allSnapshot.docs) {
        const data = d.data();
        if (data.photoUrl === 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80') {
          const updateRef = doc(db, 'candidates', d.id);
          await setDoc(updateRef, { photoUrl: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=800&q=80' }, { merge: true });
          console.log(`Auto-migrated candidate ${data.name} to African model photo`);
        }
      }
    }
  } catch (error) {
    console.warn('Seed database skipped or failed (likely permissions):', error);
  }
};
