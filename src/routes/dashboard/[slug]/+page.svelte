<script lang="ts">
    import { codeToHuman } from "$lib";

    import { m } from "$lib/paraglide/messages";

	import type { GuildChannelRatings, GuildRatings, Rating } from "$lib/server/db/bot-schema";

    const { data, form } = $props();

    type OverrideRating = "safe" | "questionable" | "explicit";

    function initForm() {
        return {
            lang: data.settings.lang,
            allowUserLang: data.settings.allowUserLang,
            viewJoinButton: data.settings.viewJoinButton,

            description: data.settings.description ?? "",
            public: Boolean(data.settings.invite),

            ratings: structuredClone(data.settings.ratings) as GuildRatings,
            channelRatings: structuredClone(data.settings.channelRatings) as GuildChannelRatings,

            logch: data.settings.logch ?? "",

            battleTime: data.settings.battleTime
        };
    };

    let formState = $state(initForm());
    let submitting = $state(false);

    function resetForm() {
        formState = initForm();
    };

    const channelRatingOverrides = $derived(
        (["safe", "questionable", "explicit"] as const).flatMap((rating) =>
            (formState.channelRatings[rating] ?? []).map((id) => ({id, rating}))
        )
    )

    const usedOverrides = $derived(
        new Set(channelRatingOverrides.map((obj) => obj.id))
    );

    function addOverride() {
        const unused = data.channels.find(
            (c) => c.type === 0 && !usedOverrides.has(c.id)
        );

        if (!unused) return;

        formState.channelRatings.questionable.push(unused.id);
    }

    function removeOverride(cid: string) {
        for (const key of ["safe", "questionable", "explicit"] as const) {
            formState.channelRatings[key] = formState.channelRatings[key].filter(
                (id) => id !== cid
            );
        }
    }

    function changeOverrideChannel(oldcid: string, newcid: string, rating: OverrideRating) {
        removeOverride(oldcid);
        formState.channelRatings[rating].push(newcid);
    }

    function changeOverrideRating(cid: string, oldRating: OverrideRating, newRating: OverrideRating) {
        formState.channelRatings[oldRating] = formState.channelRatings[oldRating].filter(
            (id) => id !== cid
        );
        formState.channelRatings[newRating].push(cid);
    }

    function toggleRating(context: "normal" | "nsfw", rating: Rating) {
        const list = formState.ratings[context];
        const idx = list.indexOf(rating);

        if      (idx === -1)      list.push(rating);
        else if (list.length > 1) list.splice(idx, 1);
    }

    let modified = $derived(
        formState.lang !== data.settings.lang ||
        formState.allowUserLang !== data.settings.allowUserLang ||
        formState.viewJoinButton !== data.settings.viewJoinButton ||

        formState.description !== data.settings.description ||
        formState.public !== Boolean(data.settings.invite) ||

        JSON.stringify(formState.ratings) !== JSON.stringify(data.settings.ratings) ||
        JSON.stringify(formState.channelRatings) !== JSON.stringify(data.settings.channelRatings) ||

        formState.logch !== data.settings.logch ||

        formState.battleTime !== data.settings.battleTime
    );
</script>

<svelte:head>
    <title>{m["dashboard.slug.title"]({ name: data.guild.name })}</title>
</svelte:head>
<main>
    <h1 class="title">Settings for <span class="text-blurple-light">{data.guild.name}</span></h1>
    <div class="sect">

    </div>
</main>