-- =========================================================================
-- FLOWSITES: Restore Google Identities in auth.identities
-- This links all 23 Google accounts so GoTrue does not throw 500
-- =========================================================================

-- Identity for samsolutions567@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4f8cdb7e-7364-49d3-a02e-02df60381018',
  '{"sub":"101124494531592479151","email":"samsolutions567@gmail.com","email_verified":true,"full_name":"Ai sam","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLKeG6u_nNlhAYySqarOcAb-3GrPdB80Y7fYUUZOPuqganiZQ=s96-c","name":"Ai sam","picture":"https://lh3.googleusercontent.com/a/ACg8ocLKeG6u_nNlhAYySqarOcAb-3GrPdB80Y7fYUUZOPuqganiZQ=s96-c","provider_id":"101124494531592479151"}'::jsonb,
  'google',
  '101124494531592479151',
  NOW(),
  '2026-07-07 13:52:10.546831+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for flowsites45@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '4c663af7-8503-4bd4-8003-36786e6a6bf8',
  '{"sub":"110581743057842624524","email":"flowsites45@gmail.com","email_verified":true,"full_name":"Flowsites","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocK49Eo5SAin92pGlP6FironnGuCqHkxfHeyiqimCuLEIMY9Cg=s96-c","name":"Flowsites","picture":"https://lh3.googleusercontent.com/a/ACg8ocK49Eo5SAin92pGlP6FironnGuCqHkxfHeyiqimCuLEIMY9Cg=s96-c","provider_id":"110581743057842624524"}'::jsonb,
  'google',
  '110581743057842624524',
  NOW(),
  '2026-07-08 08:17:07.562821+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for samsolutions10@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2624a3e0-a280-4d0a-8b52-cd540d04ef83',
  '{"sub":"113140074412134179501","email":"samsolutions10@gmail.com","email_verified":true,"full_name":"Ai Sam","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocK2Czmw4gZgHx1JtsI5AosBOUCmO9MUDq4TOOiXVGdkJ9sB3g=s96-c","name":"Ai Sam","picture":"https://lh3.googleusercontent.com/a/ACg8ocK2Czmw4gZgHx1JtsI5AosBOUCmO9MUDq4TOOiXVGdkJ9sB3g=s96-c","provider_id":"113140074412134179501"}'::jsonb,
  'google',
  '113140074412134179501',
  NOW(),
  '2026-07-08 06:37:28.126434+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for samsolutions11111@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c8c2fac7-abfd-4aca-ae9d-7e2bca1c1b19',
  '{"sub":"113090589117662526367","email":"samsolutions11111@gmail.com","email_verified":true,"full_name":"Ai Sam","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKjJSThjpz4DjcrhE8IekbCu_uPuiko2aTprYTfeuqRLl7MQQ=s96-c","name":"Ai Sam","picture":"https://lh3.googleusercontent.com/a/ACg8ocKjJSThjpz4DjcrhE8IekbCu_uPuiko2aTprYTfeuqRLl7MQQ=s96-c","provider_id":"113090589117662526367"}'::jsonb,
  'google',
  '113090589117662526367',
  NOW(),
  '2026-07-08 08:32:16.908657+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for humans@bombaymedia.in
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '2d0081ab-5890-47a7-a240-8632c8d51580',
  '{"sub":"100684687917561729530","email":"humans@bombaymedia.in","email_verified":true,"full_name":"Humans of Bombay Media","avatar_url":"","name":"Humans of Bombay Media","picture":"","provider_id":"100684687917561729530"}'::jsonb,
  'google',
  '100684687917561729530',
  NOW(),
  '2026-10-13 10:49:45.05399+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for 24r01a6651@cmrithyderabad.edu.in
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'efbadbd4-72ac-4577-903a-a830adb278ee',
  '{"sub":"117591415583892876749","email":"24r01a6651@cmrithyderabad.edu.in","email_verified":true,"full_name":"SAJAL SHRIVASTAVA 24R01A6651","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocJu-S4wgGsRWWfmk1upE1nVN9p0Am4Gpm_hdI4B28GbXZPv4g=s96-c","name":"SAJAL SHRIVASTAVA 24R01A6651","picture":"https://lh3.googleusercontent.com/a/ACg8ocJu-S4wgGsRWWfmk1upE1nVN9p0Am4Gpm_hdI4B28GbXZPv4g=s96-c","provider_id":"117591415583892876749"}'::jsonb,
  'google',
  '117591415583892876749',
  NOW(),
  '2026-07-14 16:18:29.04566+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for x0toxin86@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9765b742-969d-49c2-89bf-bfcc5d6e051f',
  '{"sub":"102148380377325517401","email":"x0toxin86@gmail.com","email_verified":true,"full_name":"X0 Toxin","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKb4iKm6WpZ8snf01yBwBBsh4NjloSz7PhQgWOhufhuBnSbsA=s96-c","name":"X0 Toxin","picture":"https://lh3.googleusercontent.com/a/ACg8ocKb4iKm6WpZ8snf01yBwBBsh4NjloSz7PhQgWOhufhuBnSbsA=s96-c","provider_id":"102148380377325517401"}'::jsonb,
  'google',
  '102148380377325517401',
  NOW(),
  '2026-08-04 10:57:11.783356+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for maxweb254@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '1dc45f6a-7575-4000-a168-362e4b55af50',
  '{"sub":"102877265610532099715","email":"maxweb254@gmail.com","email_verified":true,"full_name":"max web","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLefLVckc2prWd2esa2BeTj4O0qLqOWksLLx1rmf_dijiOSEQ=s96-c","name":"max web","picture":"https://lh3.googleusercontent.com/a/ACg8ocLefLVckc2prWd2esa2BeTj4O0qLqOWksLLx1rmf_dijiOSEQ=s96-c","provider_id":"102877265610532099715"}'::jsonb,
  'google',
  '102877265610532099715',
  NOW(),
  '2026-07-23 17:21:08.016656+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for vallurichard1234@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '085e2c3a-0e11-4e23-bd81-42c3c33591f1',
  '{"sub":"108716784741082937597","email":"vallurichard1234@gmail.com","email_verified":true,"full_name":"Richard Valluri","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKIA6seGwW3RTpRfNauGrFeagbMBGe3TDwkgje4_Nue-d7U_g=s96-c","name":"Richard Valluri","picture":"https://lh3.googleusercontent.com/a/ACg8ocKIA6seGwW3RTpRfNauGrFeagbMBGe3TDwkgje4_Nue-d7U_g=s96-c","provider_id":"108716784741082937597"}'::jsonb,
  'google',
  '108716784741082937597',
  NOW(),
  '2026-08-01 06:11:34.032402+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for khantaranum954@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '6d46ffb4-f85f-4640-8faf-65227e7685de',
  '{"sub":"112933340019847858346","email":"khantaranum954@gmail.com","email_verified":true,"full_name":"Taranum Khan","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocJ8UWg5Ogn0PFU_zBxyCZgr4Jpz6SFl5UTamw1oBh55TyeTKA=s96-c","name":"Taranum Khan","picture":"https://lh3.googleusercontent.com/a/ACg8ocJ8UWg5Ogn0PFU_zBxyCZgr4Jpz6SFl5UTamw1oBh55TyeTKA=s96-c","provider_id":"112933340019847858346"}'::jsonb,
  'google',
  '112933340019847858346',
  NOW(),
  '2026-10-09 15:51:23.50993+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for vinaycharyvelpula@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3f0e3395-397a-403e-92d2-489ef4596367',
  '{"sub":"100413637841018368727","email":"vinaycharyvelpula@gmail.com","email_verified":true,"full_name":"Vinay Velpula","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocJZ4P_MjVJu3L1Vlblh7nyv60Is4MskqEM_4C1DjG_0xV9SJU5q=s96-c","name":"Vinay Velpula","picture":"https://lh3.googleusercontent.com/a/ACg8ocJZ4P_MjVJu3L1Vlblh7nyv60Is4MskqEM_4C1DjG_0xV9SJU5q=s96-c","provider_id":"100413637841018368727"}'::jsonb,
  'google',
  '100413637841018368727',
  NOW(),
  '2026-08-08 04:23:06.768622+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for greyoo365@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'f7ee38af-793b-4943-aa1e-0b3a016bcd82',
  '{"sub":"116081353487055677017","email":"greyoo365@gmail.com","email_verified":true,"full_name":"Greyo","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocIgTo-fzIDLTDEukPIre59VxZgK5kjIhc1XRb7vsAWnxFb2TQ=s96-c","name":"Greyo","picture":"https://lh3.googleusercontent.com/a/ACg8ocIgTo-fzIDLTDEukPIre59VxZgK5kjIhc1XRb7vsAWnxFb2TQ=s96-c","provider_id":"116081353487055677017"}'::jsonb,
  'google',
  '116081353487055677017',
  NOW(),
  '2026-08-05 20:30:28.037814+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for syed.imran8751@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '01010706-3df0-4fac-95fc-dbb212608d42',
  '{"sub":"118194968989117649769","email":"syed.imran8751@gmail.com","email_verified":true,"full_name":"syed imran","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKQKP7vI4hoaqtNjPKUsH1tePcYnEHGAr0Lj1jzNFoEI3jLtg=s96-c","name":"syed imran","picture":"https://lh3.googleusercontent.com/a/ACg8ocKQKP7vI4hoaqtNjPKUsH1tePcYnEHGAr0Lj1jzNFoEI3jLtg=s96-c","provider_id":"118194968989117649769"}'::jsonb,
  'google',
  '118194968989117649769',
  NOW(),
  '2026-10-09 15:19:09.74556+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for emmanuelkeys089@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '52bcaf2d-fa16-4906-a2bf-84041cb41519',
  '{"sub":"107675939047433589007","email":"emmanuelkeys089@gmail.com","email_verified":true,"full_name":"EMMANUEL KEYS","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocImoodGXloG7OWDZ1nVrtiHkuVxKkBeWSAaeIcL68k24LkVS4ha=s96-c","name":"EMMANUEL KEYS","picture":"https://lh3.googleusercontent.com/a/ACg8ocImoodGXloG7OWDZ1nVrtiHkuVxKkBeWSAaeIcL68k24LkVS4ha=s96-c","provider_id":"107675939047433589007"}'::jsonb,
  'google',
  '107675939047433589007',
  NOW(),
  '2026-08-12 12:12:16.449344+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for azeemakinpelu2008@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '0fd3661e-2349-4429-aebd-91ce580fc33a',
  '{"sub":"111759418104565807244","email":"azeemakinpelu2008@gmail.com","email_verified":true,"full_name":"Azeem Akinpelu","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocJahiV4SQVOiHvBJ_nisYcQcXzCxRmPrhV1fB01EaHNrSoM5N3f=s96-c","name":"Azeem Akinpelu","picture":"https://lh3.googleusercontent.com/a/ACg8ocJahiV4SQVOiHvBJ_nisYcQcXzCxRmPrhV1fB01EaHNrSoM5N3f=s96-c","provider_id":"111759418104565807244"}'::jsonb,
  'google',
  '111759418104565807244',
  NOW(),
  '2026-10-10 20:21:09.828133+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for prithu.bansal05@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '23ca614f-f244-4a41-9a7b-69e4556de5be',
  '{"sub":"116849915351808639522","email":"prithu.bansal05@gmail.com","email_verified":true,"full_name":"prithu bansal","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLLRr-bZNGX-Nf00gxTmPdQdubIDhCOV5gnGvAn64Cm-AjFLA=s96-c","name":"prithu bansal","picture":"https://lh3.googleusercontent.com/a/ACg8ocLLRr-bZNGX-Nf00gxTmPdQdubIDhCOV5gnGvAn64Cm-AjFLA=s96-c","provider_id":"116849915351808639522"}'::jsonb,
  'google',
  '116849915351808639522',
  NOW(),
  '2026-10-09 15:23:05.500633+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for neonghost2401@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'b2b7ae8e-a7ef-4740-84d1-1348cdda79d3',
  '{"sub":"113889209033551004961","email":"neonghost2401@gmail.com","email_verified":true,"full_name":"Neon Ghost","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocIg8rGUyBsjDo7-1vQ3_dII1cakK0G0_bTKPrVgN05HYNTIcg=s96-c","name":"Neon Ghost","picture":"https://lh3.googleusercontent.com/a/ACg8ocIg8rGUyBsjDo7-1vQ3_dII1cakK0G0_bTKPrVgN05HYNTIcg=s96-c","provider_id":"113889209033551004961"}'::jsonb,
  'google',
  '113889209033551004961',
  NOW(),
  '2026-10-09 19:19:42.572579+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for gangularaviteja2807@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '3a1075f4-1585-439a-b6b1-63617721900b',
  '{"sub":"100302890113128019583","email":"gangularaviteja2807@gmail.com","email_verified":true,"full_name":"Ravi Teja","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLWINGUIgX9dr1PiSEva6j_RT1V59w_jf1JxSq5cXhZFQumoXDzGA=s96-c","name":"Ravi Teja","picture":"https://lh3.googleusercontent.com/a/ACg8ocLWINGUIgX9dr1PiSEva6j_RT1V59w_jf1JxSq5cXhZFQumoXDzGA=s96-c","provider_id":"100302890113128019583"}'::jsonb,
  'google',
  '100302890113128019583',
  NOW(),
  '2026-10-11 15:48:37.554314+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for abhishek@whitethoughts.in
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '86e2b3eb-3a94-4b8e-a1e9-dea33dd10d0c',
  '{"sub":"108779592984242328822","email":"abhishek@whitethoughts.in","email_verified":true,"full_name":"Abhishek Tejith Kumar","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocLnmwXNg8YHvq7t-MTOx0y3IyUmB-0aBe9U8FGnORCxUH0Iakc=s96-c","name":"Abhishek Tejith Kumar","picture":"https://lh3.googleusercontent.com/a/ACg8ocLnmwXNg8YHvq7t-MTOx0y3IyUmB-0aBe9U8FGnORCxUH0Iakc=s96-c","provider_id":"108779592984242328822"}'::jsonb,
  'google',
  '108779592984242328822',
  NOW(),
  '2026-10-12 05:02:35.63112+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for theabdzin77@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '807b6e98-7cbb-4c8f-8540-4714798efbfc',
  '{"sub":"117822375434319365974","email":"theabdzin77@gmail.com","email_verified":true,"full_name":"design talk bro","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocKZh90U907AyBuIUS3eJ6tN7qCcQ1HWKwXMW-zhQ3Rjkq9t3rAh=s96-c","name":"design talk bro","picture":"https://lh3.googleusercontent.com/a/ACg8ocKZh90U907AyBuIUS3eJ6tN7qCcQ1HWKwXMW-zhQ3Rjkq9t3rAh=s96-c","provider_id":"117822375434319365974"}'::jsonb,
  'google',
  '117822375434319365974',
  NOW(),
  '2026-10-11 19:02:19.078257+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();

-- Identity for madhukiran301@gmail.com
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '5a60a570-9b21-4a5c-94d9-e7e45fc37fa5',
  '{"sub":"111269437099345756411","email":"madhukiran301@gmail.com","email_verified":true,"full_name":"Madhu Kiran","avatar_url":"https://lh3.googleusercontent.com/a/ACg8ocIBiu1JfdoPOBaRIPYY_CYUXu--aDE9AkDstnJDeKlesO4BEh7g=s96-c","name":"Madhu Kiran","picture":"https://lh3.googleusercontent.com/a/ACg8ocIBiu1JfdoPOBaRIPYY_CYUXu--aDE9AkDstnJDeKlesO4BEh7g=s96-c","provider_id":"111269437099345756411"}'::jsonb,
  'google',
  '111269437099345756411',
  NOW(),
  '2026-10-12 05:31:17.314345+00',
  NOW()
) ON CONFLICT (provider, provider_id) DO UPDATE
SET
  identity_data = EXCLUDED.identity_data,
  last_sign_in_at = NOW(),
  updated_at = NOW();
