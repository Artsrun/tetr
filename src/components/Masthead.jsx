import { editionHref, isV2, otherEdition } from '../lib/edition.js'
import ToolButton from './ToolButton.jsx'

/**
 * The cover. One button, top-left, that flips to the other edition — the whole
 * rebrand lives behind `?v=2` and a stranger with a link has to be able to
 * find the other one. v1 shows the mark alone; v2 wears its name.
 */
export default function Masthead({ edition }) {
  const other = otherEdition(edition)

  return (
    <div className={`masthead ${isV2(edition) ? 'is-v2' : ''}`.trim()}>
      <ToolButton
        label={`Բացել «${other.name}» տարբերակը`}
        className="masthead__flip"
        cue="flip"
        onPress={() => {
          if (typeof location !== 'undefined') location.href = editionHref(other)
        }}
      >
        <span className="masthead__mark" aria-hidden="true">{edition.mark}</span>
        {isV2(edition) && <span className="masthead__name">{edition.name}</span>}
      </ToolButton>
    </div>
  )
}
