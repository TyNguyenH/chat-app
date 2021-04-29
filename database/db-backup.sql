--
-- PostgreSQL database dump
--

-- Dumped from database version 11.10
-- Dumped by pg_dump version 11.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: convertvntoeng(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.convertvntoeng(chars text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
 withTone text; noTone text; res text;
BEGIN
 withTone = 'áàảãạâấầẩẫậăắằẳẵặđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵÁÀẢÃẠÂẤẦẨẪẬĂẮẰẲẴẶĐÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ';
 noTone = 'aaaaaaaaaaaaaaaaadeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyAAAAAAAAAAAAAAAAADEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYY';
 res = chars;
 FOR i IN 0..length(withTone)
 LOOP
 res = replace(res, substr(withTone, i, 1), substr(noTone, i, 1));
 END LOOP;
 RETURN res;
END;
$$;


ALTER FUNCTION public.convertvntoeng(chars text) OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: fileinfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fileinfo (
    fileid bigint NOT NULL,
    filepath text,
    filetype character varying(10) NOT NULL
);


ALTER TABLE public.fileinfo OWNER TO postgres;

--
-- Name: fileinfo_fileid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fileinfo_fileid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fileinfo_fileid_seq OWNER TO postgres;

--
-- Name: fileinfo_fileid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fileinfo_fileid_seq OWNED BY public.fileinfo.fileid;


--
-- Name: friendship; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friendship (
    userid1 integer NOT NULL,
    userid2 integer NOT NULL,
    friendstatus character varying(12) NOT NULL,
    actionuserid integer NOT NULL,
    CONSTRAINT friendship_check CHECK ((userid2 <> userid1))
);


ALTER TABLE public.friendship OWNER TO postgres;

--
-- Name: groupinfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groupinfo (
    groupid bigint NOT NULL,
    groupname character varying(30) NOT NULL,
    createdate date NOT NULL,
    isactive boolean NOT NULL
);


ALTER TABLE public.groupinfo OWNER TO postgres;

--
-- Name: groupinfo_groupid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.groupinfo_groupid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.groupinfo_groupid_seq OWNER TO postgres;

--
-- Name: groupinfo_groupid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.groupinfo_groupid_seq OWNED BY public.groupinfo.groupid;


--
-- Name: messageinfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messageinfo (
    messageid bigint NOT NULL,
    creatorid integer NOT NULL,
    messagetext text,
    fileid integer,
    createdate timestamp with time zone NOT NULL
);


ALTER TABLE public.messageinfo OWNER TO postgres;

--
-- Name: messageinfo_messageid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messageinfo_messageid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.messageinfo_messageid_seq OWNER TO postgres;

--
-- Name: messageinfo_messageid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messageinfo_messageid_seq OWNED BY public.messageinfo.messageid;


--
-- Name: messagerecipient; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messagerecipient (
    messageid bigint NOT NULL,
    recipientid bigint NOT NULL,
    recipientgroupid bigint,
    hasread boolean NOT NULL
);


ALTER TABLE public.messagerecipient OWNER TO postgres;

--
-- Name: useraccount; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.useraccount (
    userid bigint NOT NULL,
    email character varying(128) NOT NULL,
    userpassword character varying(128) NOT NULL
);


ALTER TABLE public.useraccount OWNER TO postgres;

--
-- Name: useraccount_userid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.useraccount_userid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.useraccount_userid_seq OWNER TO postgres;

--
-- Name: useraccount_userid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.useraccount_userid_seq OWNED BY public.useraccount.userid;


--
-- Name: usergroup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usergroup (
    userid integer NOT NULL,
    groupid integer NOT NULL,
    joindate date NOT NULL,
    inviterid integer NOT NULL,
    CONSTRAINT usergroup_check CHECK ((inviterid <> userid))
);


ALTER TABLE public.usergroup OWNER TO postgres;

--
-- Name: userinfo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.userinfo (
    userid integer NOT NULL,
    firstname character varying(20) NOT NULL,
    lastname character varying(20) NOT NULL,
    avatar text,
    createdate date NOT NULL,
    isactive boolean NOT NULL,
    firstnameeng character varying(20),
    lastnameeng character varying(20)
);


ALTER TABLE public.userinfo OWNER TO postgres;

--
-- Name: fileinfo fileid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fileinfo ALTER COLUMN fileid SET DEFAULT nextval('public.fileinfo_fileid_seq'::regclass);


--
-- Name: groupinfo groupid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groupinfo ALTER COLUMN groupid SET DEFAULT nextval('public.groupinfo_groupid_seq'::regclass);


--
-- Name: messageinfo messageid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messageinfo ALTER COLUMN messageid SET DEFAULT nextval('public.messageinfo_messageid_seq'::regclass);


--
-- Name: useraccount userid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.useraccount ALTER COLUMN userid SET DEFAULT nextval('public.useraccount_userid_seq'::regclass);


--
-- Data for Name: fileinfo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fileinfo (fileid, filepath, filetype) FROM stdin;
3	/imgs/user-imgs/img_251_1619448519902.jpg	jpg
4	/imgs/user-imgs/img_252_1619450018680.jpg	jpg
5	/imgs/user-imgs/img_253_1619450164334.jpg	jpg
6	/imgs/user-imgs/img_254_1619450275242.jpg	jpg
7	/imgs/user-imgs/img_255_1619450387632.jpg	jpg
8	/imgs/user-imgs/img_256_1619450387636.jpg	jpg
9	/imgs/user-imgs/img_257_1619450387641.jpg	jpg
10	/imgs/user-imgs/img_258_1619450533167.jpg	jpg
17	/imgs/user-imgs/img_268_1619491850006.jpg	jpg
18	/imgs/user-imgs/img_270_1619492957245.jpg	jpg
19	/imgs/user-imgs/img_271_1619494240722.jpg	jpg
20	/imgs/user-imgs/img_273_1619494331980.jpg	jpg
21	/imgs/user-imgs/img_274_1619494363178.jpg	jpg
31	/imgs/user-imgs/img_284_1619496596230.jpg	jpg
32	/imgs/user-imgs/img_285_1619496596236.jpg	jpg
33	/imgs/user-imgs/img_286_1619496596269.jpg	jpg
34	/imgs/user-imgs/img_287_1619496596287.jpg	jpg
35	/imgs/user-imgs/img_289_1619513656699.jpg	jpg
36	/imgs/user-imgs/img_290_1619513976429.jpg	jpg
39	/imgs/user-imgs/img_293_1619515620207.jpg	jpg
55	/imgs/user-imgs/img_309_1619518630423.jpg	jpg
56	/imgs/user-imgs/img_310_1619518630696.jpg	jpg
57	/imgs/user-imgs/img_311_1619518632557.jpg	jpg
61	/imgs/user-imgs/img_320_1619606216381.jpg	jpg
62	/imgs/user-imgs/img_319_1619606216474.jpg	jpg
63	/imgs/user-imgs/img_321_1619606217479.jpg	jpg
65	/imgs/user-imgs/img_325_1619664854425.jpg	jpg
67	/imgs/user-imgs/img_327_1619665176859.jpg	jpg
\.


--
-- Data for Name: friendship; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.friendship (userid1, userid2, friendstatus, actionuserid) FROM stdin;
45	34	request	45
45	28	friend	45
45	33	friend	45
32	45	friend	32
27	45	request	27
31	34	friend	31
32	27	friend	32
28	31	friend	28
28	30	friend	28
27	30	friend	27
30	31	friend	30
31	27	friend	31
27	28	friend	27
31	32	friend	31
28	32	request	28
33	32	request	33
33	27	request	33
34	30	request	34
33	28	request	33
31	33	request	31
34	27	request	34
44	45	friend	44
\.


--
-- Data for Name: groupinfo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groupinfo (groupid, groupname, createdate, isactive) FROM stdin;
\.


--
-- Data for Name: messageinfo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messageinfo (messageid, creatorid, messagetext, fileid, createdate) FROM stdin;
154	28	yeah yeah	\N	2021-04-16 16:01:19+07
155	28	uh huh??	\N	2021-04-16 16:02:43+07
10	28	For real??	\N	2021-04-04 17:15:15+07
11	28	Huh??	\N	2021-04-04 17:17:26+07
74	31	sorry, my car engine is dead. It should be fixed by next week	\N	2021-04-08 16:39:11+07
75	30	r u free this weekend?	\N	2021-04-08 21:45:09+07
78	30	heelo!	\N	2021-04-08 21:54:30+07
79	30	Whasup!?	\N	2021-04-08 21:55:34+07
80	27	How 'bout durian?	\N	2021-04-09 16:12:09+07
81	28	idk	\N	2021-04-09 16:20:21+07
30	27	ei yoo	\N	2021-04-06 10:48:56+07
31	31	what ??	\N	2021-04-06 10:49:01+07
32	31	u gud, bro??	\N	2021-04-06 10:50:16+07
33	27	idk, man...	\N	2021-04-06 10:52:41+07
34	31	brooo??	\N	2021-04-06 11:27:03+07
93	27	what u mean "idk"?	\N	2021-04-09 17:03:34+07
101	31	alo1234	\N	2021-04-09 21:50:24+07
102	27	??	\N	2021-04-09 21:50:52+07
112	28	ola!	\N	2021-04-10 15:48:13+07
113	30	o la la !!	\N	2021-04-10 15:49:39+07
114	28	la o la	\N	2021-04-10 15:51:59+07
115	30	la o o la	\N	2021-04-10 15:52:39+07
116	28	well, i kinda like the durian flavor but not much	\N	2021-04-10 16:31:09+07
117	28	let's talk about smth else, . . .	\N	2021-04-10 16:34:58+07
118	28	Do u like guns and stuff like that?	\N	2021-04-10 16:35:24+07
63	32	yo hoo	\N	2021-04-08 15:53:14+07
64	32	Yooo, where u at !!!!!	\N	2021-04-08 15:53:49+07
65	32	HEEEEEEY, BRO!	\N	2021-04-08 15:54:07+07
66	28	alo	\N	2021-04-08 15:56:16+07
67	28	Can u give me a lift, mate?	\N	2021-04-08 15:56:40+07
119	27	Ah, i like the kriss vector, fully equiped	\N	2021-04-10 16:36:50+07
120	28	yeah, that shit is hot, compact, versatile ...	\N	2021-04-10 16:37:25+07
121	28	btw, do u like night vision goggles?	\N	2021-04-10 16:41:48+07
122	27	ah, no, actually i dont know much 'bout them	\N	2021-04-10 16:42:15+07
123	27	do u like semi-auto rifles?	\N	2021-04-10 16:57:55+07
124	28	yeah, i like ar-15 and scar-h	\N	2021-04-10 17:04:14+07
125	27	how 'bout sniper rifles?	\N	2021-04-10 17:05:23+07
126	28	not much, 'cause i'm really bad at playing them in fps games	\N	2021-04-10 17:06:09+07
129	28	What do u think 'bout silencer and suppressor?	\N	2021-04-10 17:17:51+07
130	27	i like the sound of guns with silencer, though silencer doesnt reduce much sound	\N	2021-04-10 17:22:35+07
131	28	well, u r not wrong ...	\N	2021-04-10 17:23:03+07
5	28	I like ice-cream	\N	2021-03-20 16:44:32+07
6	27	I like too	\N	2021-03-20 16:44:36+07
4	27	What kind of food do you like to eat?	\N	2021-03-20 16:25:28+07
7	27	My favorite flavor is chocolate	\N	2021-03-20 16:45:24+07
132	45	Alo 1234 !!	\N	2021-04-11 17:47:27+07
133	44	sup nigga	\N	2021-04-11 17:47:50+07
134	44	reeeeeee	\N	2021-04-11 17:48:13+07
135	45	zeze hehe	\N	2021-04-11 17:48:46+07
136	33	alo 4321!	\N	2021-04-11 18:08:15+07
137	32	bruh	\N	2021-04-11 18:08:17+07
138	44	N	\N	2021-04-11 18:08:33+07
139	33	213ola!@	\N	2021-04-11 18:08:32+07
140	32	ÁDFGHJKLẺTYUIODFGHJKLDFGHJKFGHJKDFGHJK	\N	2021-04-11 18:09:30+07
141	32	!@#$%^&*()!@#$%^&*()!@#$%^&*()!@#$%^&*()!@#$%^&*()_!@#$%^&*()_!@#$%^&*()!@#$%^&*()!@#$%^&*()!@#$%^&*()!@#$%^&*()!@#$%^&*()_	\N	2021-04-11 18:10:02+07
142	27	yeah	\N	2021-04-14 21:25:15+07
143	30	heey!!	\N	2021-04-14 22:26:11+07
144	27	not sure?!	\N	2021-04-14 22:26:33+07
145	28	o la la o	\N	2021-04-15 18:28:59+07
146	28	yeah yeah	\N	2021-04-15 23:06:16+07
147	30	la la la	\N	2021-04-16 11:12:17+07
148	28	la la o o	\N	2021-04-16 11:17:48+07
149	30	@o@	\N	2021-04-16 11:19:05+07
150	28	ha ha	\N	2021-04-16 15:41:31+07
151	28	hehe	\N	2021-04-16 15:43:28+07
152	28	ho ho ho	\N	2021-04-16 15:56:58+07
153	28	hehe	\N	2021-04-16 15:59:58+07
156	28	1234	\N	2021-04-16 16:03:29+07
157	28	4321	\N	2021-04-16 16:13:45+07
158	28	1234	\N	2021-04-16 16:38:10+07
159	28	ha ha	\N	2021-04-16 16:48:07+07
160	28	hahaha	\N	2021-04-16 16:50:04+07
161	28	hehehe	\N	2021-04-16 16:51:40+07
162	28	alo	\N	2021-04-16 16:52:46+07
163	28	aloalo	\N	2021-04-16 17:03:49+07
164	30	what da hell??	\N	2021-04-16 17:48:43+07
165	30	aloola	\N	2021-04-16 17:51:39+07
166	27	aaaa	\N	2021-04-16 17:55:27+07
167	30	bbbb	\N	2021-04-16 17:56:04+07
168	27	cccc	\N	2021-04-16 17:56:28+07
169	30	dddd	\N	2021-04-16 18:01:20+07
170	27	eeee	\N	2021-04-16 18:04:41+07
171	30	ffff	\N	2021-04-16 18:05:51+07
172	27	gggg	\N	2021-04-16 18:07:42+07
173	30	hhhh	\N	2021-04-16 18:08:13+07
175	31	eeeiii	\N	2021-04-16 21:40:46+07
178	34	j v ba??	\N	2021-04-16 21:49:15+07
179	27	ò ó o ò	\N	2021-04-16 21:49:55+07
180	27	yeah yeah yeah	\N	2021-04-18 12:25:44+07
181	28	what chu want??	\N	2021-04-18 12:28:22+07
182	28	haha	\N	2021-04-18 15:40:58+07
183	45	what chu mean "haha"??	\N	2021-04-18 15:41:30+07
184	27	khỏe ko man?	\N	2021-04-19 09:09:13+07
185	28	hả??	\N	2021-04-19 09:13:41+07
186	30	alo123	\N	2021-04-19 09:14:08+07
187	30	ola123	\N	2021-04-19 09:15:27+07
188	30	yeet	\N	2021-04-19 09:16:38+07
189	30	yeye	\N	2021-04-19 09:21:27+07
190	30	yoyo	\N	2021-04-19 09:22:20+07
191	30	yeahyeah	\N	2021-04-19 09:29:52+07
192	30	haha	\N	2021-04-19 09:31:51+07
193	30	lololo	\N	2021-04-19 09:37:57+07
194	30	alala	\N	2021-04-19 09:41:31+07
195	30	hohoho	\N	2021-04-19 09:41:35+07
196	30	hehehe	\N	2021-04-19 09:41:38+07
197	30	yeyeyeyeye	\N	2021-04-19 09:52:42+07
198	30	hahahaha	\N	2021-04-19 09:52:44+07
199	30	blahblablha	\N	2021-04-19 09:52:47+07
200	28	alalsldasd	\N	2021-04-19 09:54:29+07
201	28	asdfasdf	\N	2021-04-19 09:54:31+07
202	28	asdf23asdr	\N	2021-04-19 09:54:32+07
203	28	asdf	\N	2021-04-19 09:54:33+07
204	28	aasd	\N	2021-04-19 09:54:51+07
205	30	ulausdf	\N	2021-04-19 09:55:09+07
206	30	heeheeeheheh	\N	2021-04-19 09:58:04+07
207	30	asdfasd	\N	2021-04-19 09:58:43+07
208	30	aasdasd	\N	2021-04-19 09:59:11+07
209	30	asdasd	\N	2021-04-19 10:00:08+07
210	30	aasd1123aad	\N	2021-04-19 10:01:34+07
211	30	11123asdasda	\N	2021-04-19 10:02:32+07
212	30	aasdasdasd	\N	2021-04-19 10:03:42+07
213	30	lllllll	\N	2021-04-19 10:05:24+07
214	30	aaaaaaaaaa	\N	2021-04-19 10:05:35+07
215	30	bbbbbbbbbb	\N	2021-04-19 10:05:38+07
216	30	cccccccccccc	\N	2021-04-19 10:05:39+07
217	30	ddddddddddd	\N	2021-04-19 10:05:40+07
218	30	eeeeeeeee	\N	2021-04-19 10:05:43+07
219	28	aaaaaaaa	\N	2021-04-19 10:06:06+07
220	28	bbbbbbbb	\N	2021-04-19 10:06:17+07
221	30	hahahaah	\N	2021-04-19 10:07:07+07
222	30	zzezrasdf	\N	2021-04-19 10:07:10+07
223	30	ei yo whatsupp, bro??	\N	2021-04-19 10:07:36+07
224	30	yooooo!!!	\N	2021-04-19 10:07:40+07
225	30	heeeeeyy!!??	\N	2021-04-19 10:07:44+07
226	45	zezeze	\N	2021-04-19 10:08:26+07
227	45	hahahsa	\N	2021-04-19 10:08:32+07
228	45	muah ha ha haa ha	\N	2021-04-19 10:09:45+07
229	28	j v ba??	\N	2021-04-19 10:09:59+07
230	45	hahaha	\N	2021-04-19 10:10:32+07
231	45	hehehe	\N	2021-04-19 10:13:23+07
232	45	aasdasd	\N	2021-04-19 10:14:05+07
233	28	asdfasdf	\N	2021-04-19 10:15:38+07
234	45	ssdfsd	\N	2021-04-19 10:15:56+07
235	45	asdasd212	\N	2021-04-19 10:16:43+07
236	45	asasdasd	\N	2021-04-19 10:17:53+07
237	45	aasd1asdasd	\N	2021-04-19 10:19:51+07
238	28	hayy??	\N	2021-04-19 22:03:09+07
239	30	haa??	\N	2021-04-19 22:08:43+07
240	28	huh??!	\N	2021-04-19 22:20:16+07
241	30	zeze	\N	2021-04-19 22:30:04+07
242	28	haha hehe	\N	2021-04-19 22:31:16+07
243	28	hehe haha	\N	2021-04-19 22:31:45+07
244	45	yoyo zeze	\N	2021-04-19 22:32:16+07
245	30	yeye	\N	2021-04-19 22:32:30+07
248	28	yep!!	\N	2021-04-22 17:52:50+07
249	28	how 'bout chu?	\N	2021-04-22 17:53:14+07
251	28	\N	3	2021-04-26 21:48:39+07
252	45	\N	4	2021-04-26 22:13:38+07
253	28	\N	5	2021-04-26 22:16:04+07
254	45	\N	6	2021-04-26 22:17:55+07
255	45	\N	7	2021-04-26 22:19:47+07
256	45	\N	8	2021-04-26 22:19:47+07
257	45	\N	9	2021-04-26 22:19:47+07
258	28	\N	10	2021-04-26 22:22:13+07
313	27	alo, yeah yeah	\N	2021-04-28 16:44:34+07
314	27	yeah yeah, alo	\N	2021-04-28 16:53:29+07
284	28	I got some candies for u	31	2021-04-27 11:09:56+07
285	28	\N	32	2021-04-27 11:09:56+07
286	28	\N	33	2021-04-27 11:09:56+07
287	28	\N	34	2021-04-27 11:09:56+07
268	45	Want some candies??	17	2021-04-27 09:50:49+07
269	28	nah...	\N	2021-04-27 10:05:19+07
290	28	\N	36	2021-04-27 15:59:36+07
271	45	How 'bout this??	19	2021-04-27 10:30:40+07
272	28	hmmm..., looks good!	\N	2021-04-27 10:30:59+07
273	45	\N	20	2021-04-27 10:32:11+07
274	45	This one is also from that brand	21	2021-04-27 10:32:43+07
293	31	How 'bout this?	39	2021-04-27 16:27:00+07
320	27	\N	61	2021-04-28 17:36:55+07
319	27	U like these??	62	2021-04-28 17:36:55+07
321	27	\N	63	2021-04-28 17:36:55+07
325	28	I got some chewing gum	65	2021-04-29 09:54:14+07
327	27	\N	67	2021-04-29 09:59:36+07
309	31	\N	55	2021-04-27 17:17:09+07
310	31	\N	56	2021-04-27 17:17:09+07
311	31	\N	57	2021-04-27 17:17:09+07
\.


--
-- Data for Name: messagerecipient; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messagerecipient (messageid, recipientid, recipientgroupid, hasread) FROM stdin;
4	28	\N	t
6	28	\N	t
101	27	\N	t
141	45	\N	t
142	28	\N	t
143	27	\N	t
144	30	\N	t
63	31	\N	f
64	31	\N	f
30	31	\N	t
31	27	\N	t
32	27	\N	t
33	31	\N	t
34	27	\N	t
7	28	\N	t
65	31	\N	f
5	27	\N	t
66	31	\N	t
67	31	\N	t
145	30	\N	t
10	27	\N	t
11	27	\N	t
146	27	\N	t
147	28	\N	t
102	31	\N	t
148	30	\N	t
79	31	\N	f
80	28	\N	t
81	27	\N	t
149	28	\N	t
112	30	\N	t
113	28	\N	t
78	28	\N	t
114	30	\N	t
93	28	\N	t
115	28	\N	t
116	27	\N	t
117	27	\N	t
118	27	\N	t
119	28	\N	t
120	27	\N	t
121	27	\N	t
122	28	\N	t
123	28	\N	t
124	27	\N	t
125	28	\N	t
126	27	\N	t
157	30	\N	t
158	30	\N	t
129	27	\N	t
130	28	\N	t
131	27	\N	t
75	27	\N	t
132	44	\N	t
133	45	\N	t
134	45	\N	t
135	44	\N	t
138	45	\N	t
137	45	\N	t
136	45	\N	t
139	45	\N	t
140	45	\N	t
150	30	\N	t
151	30	\N	t
152	30	\N	t
153	30	\N	t
154	30	\N	t
155	30	\N	t
156	30	\N	t
159	30	\N	t
160	30	\N	t
161	30	\N	t
162	30	\N	t
163	30	\N	t
164	28	\N	t
165	27	\N	t
166	30	\N	t
167	27	\N	t
168	30	\N	t
169	27	\N	t
170	30	\N	t
171	27	\N	t
172	30	\N	t
173	27	\N	t
184	28	\N	t
175	34	\N	t
178	31	\N	t
179	31	\N	t
180	28	\N	t
181	27	\N	t
182	45	\N	t
183	28	\N	t
185	30	\N	t
186	28	\N	t
187	28	\N	t
188	28	\N	t
189	28	\N	t
190	28	\N	t
191	28	\N	t
192	28	\N	t
193	28	\N	t
194	28	\N	t
195	28	\N	t
196	28	\N	t
197	28	\N	t
198	28	\N	t
199	28	\N	t
200	30	\N	t
201	30	\N	t
202	30	\N	t
203	30	\N	t
204	30	\N	t
205	28	\N	t
206	28	\N	t
207	28	\N	t
208	28	\N	t
210	28	\N	t
211	28	\N	t
212	28	\N	t
213	28	\N	t
214	28	\N	t
215	28	\N	t
216	28	\N	t
217	28	\N	t
218	28	\N	t
219	30	\N	t
220	30	\N	t
221	28	\N	t
222	28	\N	t
223	28	\N	t
224	28	\N	t
225	28	\N	t
226	28	\N	t
227	28	\N	t
228	28	\N	t
229	45	\N	t
230	28	\N	t
231	28	\N	t
232	28	\N	t
233	45	\N	t
234	28	\N	t
235	28	\N	t
236	28	\N	t
237	28	\N	t
74	28	\N	t
238	30	\N	t
239	28	\N	t
240	30	\N	t
242	45	\N	t
243	45	\N	t
241	28	\N	t
245	28	\N	t
244	28	\N	t
248	27	\N	t
249	27	\N	t
251	45	\N	t
252	28	\N	t
253	45	\N	t
254	28	\N	t
255	45	\N	t
256	45	\N	t
257	45	\N	t
258	45	\N	t
268	28	\N	t
269	45	\N	t
271	28	\N	t
272	45	\N	t
273	28	\N	t
274	28	\N	t
313	28	\N	t
314	28	\N	t
309	34	\N	t
310	34	\N	t
284	30	\N	t
285	30	\N	t
286	30	\N	t
287	30	\N	t
311	34	\N	t
290	31	\N	t
319	28	\N	t
320	28	\N	t
321	28	\N	t
293	28	\N	t
325	27	\N	t
327	28	\N	t
\.


--
-- Data for Name: useraccount; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.useraccount (userid, email, userpassword) FROM stdin;
30	jimmi@gmail.com	79bc4b08613f14f23b6de998dd0369a70757b6b06896ddf7212190efe0f2f8f6
27	ty@gmail.com	3d8c400a8d25320c39b5e172a4a537ecc017bfd48e8805aed6a019b9673270ab
28	bot@gmail.com	be1df577011f987938779b7c5dab76b2639e8cdb2e1ac9014acb4a2788b78542
31	tri@gmail.com	0621201787023d139a92746ccf25c12d78dd2b05a0f63fb6c65fb0984d746a01
32	khoai@gmail.com	6a278452079c408faa53cc47c9114967f117063f28729fbb6736e1bb9efcd7be
33	cua@gmail.com	946f0f1e02ba9fa2f4697fa415dddb21b8d2c0a7cc01b3f0bfcc6f99d81264af
34	la@gmail.com	c36ffe81e0e7d2c2350e3e8aaa84072880bb70529a5a5158be3bcc170f7f6248
44	minhb1704833@student.ctu.edu.vn	b54736e73de69d7169f357731be10da81095e1cd4b0ab23fea4617345d5f5060
45	tyb1706552@student.ctu.edu.vn	7b8b0266fa33595f56c2f4ff681407b49ac331d5721f988d4ffeb42453c28170
\.


--
-- Data for Name: usergroup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usergroup (userid, groupid, joindate, inviterid) FROM stdin;
\.


--
-- Data for Name: userinfo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.userinfo (userid, firstname, lastname, avatar, createdate, isactive, firstnameeng, lastnameeng) FROM stdin;
27	Tỷ	Nguyễn	/avatars/avatar_1613879928528.jpg	2021-02-21	t	Ty	Nguyen
28	Lú	Bọt	/avatars/avatar_1613880807073.jpg	2021-02-21	t	Lu	Bot
30	jimmi	ngủyên	/avatars/avatar_1614163561199.png	2021-02-24	t	jimmi	nguyen
31	Trí	Trần	/avatars/avatar_1614853312661.jpg	2021-03-04	t	Tri	Tran
33	Cua	Ngang	/avatars/avatar_1616408439257.jpg	2021-03-22	t	Cua	Ngang
34	Lá	Cành Thị	/avatars/avatar_1616661249041.jpg	2021-03-25	t	La	Canh Thi
32	Gian	Khoai	/avatars/avatar_1616060535623.png	2021-03-18	t	Gian	Khoai
44	Tử Minh	Khưu	/avatars/avatar_1618137650214.jpg	2021-04-11	t	Tu Minh	Khuu
45	Tỷ Đô	Joe	/avatars/avatar_1618137649981.jpg	2021-04-11	t	Ty Do	Joe
\.


--
-- Name: fileinfo_fileid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fileinfo_fileid_seq', 67, true);


--
-- Name: groupinfo_groupid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groupinfo_groupid_seq', 1, false);


--
-- Name: messageinfo_messageid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messageinfo_messageid_seq', 327, true);


--
-- Name: useraccount_userid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.useraccount_userid_seq', 45, true);


--
-- Name: fileinfo fileinfo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fileinfo
    ADD CONSTRAINT fileinfo_pkey PRIMARY KEY (fileid);


--
-- Name: groupinfo groupinfo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groupinfo
    ADD CONSTRAINT groupinfo_pkey PRIMARY KEY (groupid);


--
-- Name: messageinfo messageinfo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messageinfo
    ADD CONSTRAINT messageinfo_pkey PRIMARY KEY (messageid);


--
-- Name: useraccount useraccount_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.useraccount
    ADD CONSTRAINT useraccount_email_key UNIQUE (email);


--
-- Name: useraccount useraccount_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.useraccount
    ADD CONSTRAINT useraccount_pkey PRIMARY KEY (userid);


--
-- Name: usergroup usergroup_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usergroup
    ADD CONSTRAINT usergroup_pkey PRIMARY KEY (userid, groupid);


--
-- Name: friendship friendship_actionuserid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_actionuserid_fkey FOREIGN KEY (actionuserid) REFERENCES public.useraccount(userid);


--
-- Name: friendship friendship_userid1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_userid1_fkey FOREIGN KEY (userid1) REFERENCES public.useraccount(userid);


--
-- Name: friendship friendship_userid2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friendship
    ADD CONSTRAINT friendship_userid2_fkey FOREIGN KEY (userid2) REFERENCES public.useraccount(userid);


--
-- Name: messageinfo messageinfo_creatorid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messageinfo
    ADD CONSTRAINT messageinfo_creatorid_fkey FOREIGN KEY (creatorid) REFERENCES public.useraccount(userid);


--
-- Name: messageinfo messageinfo_fileid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messageinfo
    ADD CONSTRAINT messageinfo_fileid_fkey FOREIGN KEY (fileid) REFERENCES public.fileinfo(fileid);


--
-- Name: messagerecipient messagerecipient_messageid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messagerecipient
    ADD CONSTRAINT messagerecipient_messageid_fkey FOREIGN KEY (messageid) REFERENCES public.messageinfo(messageid);


--
-- Name: messagerecipient messagerecipient_recipientgroupid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messagerecipient
    ADD CONSTRAINT messagerecipient_recipientgroupid_fkey FOREIGN KEY (recipientgroupid) REFERENCES public.groupinfo(groupid);


--
-- Name: messagerecipient messagerecipient_recipientid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messagerecipient
    ADD CONSTRAINT messagerecipient_recipientid_fkey FOREIGN KEY (recipientid) REFERENCES public.useraccount(userid);


--
-- Name: usergroup usergroup_groupid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usergroup
    ADD CONSTRAINT usergroup_groupid_fkey FOREIGN KEY (groupid) REFERENCES public.groupinfo(groupid);


--
-- Name: usergroup usergroup_inviterid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usergroup
    ADD CONSTRAINT usergroup_inviterid_fkey FOREIGN KEY (inviterid) REFERENCES public.useraccount(userid);


--
-- Name: usergroup usergroup_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usergroup
    ADD CONSTRAINT usergroup_userid_fkey FOREIGN KEY (userid) REFERENCES public.useraccount(userid);


--
-- Name: userinfo userinfo_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.userinfo
    ADD CONSTRAINT userinfo_userid_fkey FOREIGN KEY (userid) REFERENCES public.useraccount(userid);


--
-- PostgreSQL database dump complete
--

